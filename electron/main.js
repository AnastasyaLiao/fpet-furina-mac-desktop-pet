// 桌面宠物 —— Electron 主进程（精简：透明 + 无边框 + 置顶 + 鼠标穿透 + 托盘）
const { app, BrowserWindow, Tray, Menu, nativeImage, screen, shell, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

// ---------- 单实例锁 ----------
// 开机自启与手动启动可能同时触发，抢同一个 8623 端口。
// 保证任意时刻只有一个桌宠实例：后启动的实例自动退出，把控制权交给已运行的那个。
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// ---------- 大模型对话（驱动桌宠对话气泡） ----------
// 不再内置任何厂商 API 密钥与官方地址：由用户在设置面板填写自己的配置，
// 支持接入多种大模型（目前内置 DeepSeek / Ollama 两种，OpenAI 兼容协议可继续扩展）。
// 回复同时推送给桌宠窗口显示气泡。
// ---------- 大模型默认配置项（实际值存于 config.json 的 llm 字段，热更新生效） ----------
const LLM_DEFAULTS = {
  provider: "deepseek",                       // deepseek | ollama
  apiKey: "",                                 // DeepSeek 的 API Key（Ollama 通常无需 Key）
  baseUrl: "https://api.deepseek.com/v1",     // OpenAI 兼容接口基地址
  model: "deepseek-chat",                     // DeepSeek 模型名
  ollamaUrl: "http://127.0.0.1:11434",        // Ollama 服务地址
  ollamaModel: "qwen2.5:7b",                  // Ollama 模型名
  configured: false,                          // 是否已完成接入（配置并保存后为 true）
  setupPrompts: 0,                            // 首次启动引导接入的次数（最多 3 次，之后不再自动提示）
};
// 读取当前大模型配置（合并默认值，保证字段齐全）
function llmConfig() {
  const cfg = readConfig();
  return Object.assign({}, LLM_DEFAULTS, (cfg && cfg.llm) || {});
}
// 是否已完成可用接入：DeepSeek 需 Key；Ollama 需服务地址 + 模型名
function isLLMConfigured(cfg) {
  const c = cfg || llmConfig();
  if (c.provider === "ollama") return !!(String(c.ollamaUrl || "").trim() && String(c.ollamaModel || "").trim());
  return !!String(c.apiKey || "").trim();
}
// 保存大模型配置（把用户提交的字段合并进 config.json，并标记为已配置）
function saveLLMConfig(data) {
  const cfg = readConfig();
  const padded = (s) => String(s == null ? "" : s).trim();
  cfg.llm = Object.assign({}, llmConfig(), {
    provider: data.provider === "ollama" ? "ollama" : "deepseek",
    apiKey: padded(data.apiKey),
    baseUrl: padded(data.baseUrl),
    model: padded(data.model),
    ollamaUrl: padded(data.ollamaUrl),
    ollamaModel: padded(data.ollamaModel),
    configured: true, // 只要用户显式保存过，就视为已接入（避免反复引导）
  });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  return cfg.llm;
}
// 屏蔽敏感字段后返回给前端展示（Key 只显示末尾几位）
function maskedLLM() {
  const c = llmConfig();
  const safe = Object.assign({}, c);
  if (c.apiKey) safe.apiKey = c.apiKey.slice(-4).padStart(c.apiKey.length, "*");
  return safe;
}
// 通用 JSON 请求（自动区分 http/https，可选 Bearer 校验）
function requestJSON(url, payload, bearer, onOk, onErr) {
  const lib = url.startsWith("https:") ? https : http;
  const body = JSON.stringify(payload);
  const req = lib.request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        "Content-Length": Buffer.byteLength(body),
      },
    },
    (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          const data = JSON.parse(raw);
          const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (text) onOk(text.trim());
          else onErr(raw || "大模型无回复");
        } catch (e) {
          onErr(raw || String(e));
        }
      });
    }
  );
  req.on("error", (e) => onErr(String(e)));
  req.write(body);
  req.end();
}
// 统一大模型请求分发：根据配置把消息发给所选厂商（OpenAI 兼容协议）
// 可传入 cfgOverride 用于连通性测试（不改变已保存的配置）
function llmRequest(messages, onOk, onErr, cfgOverride) {
  let c = cfgOverride || llmConfig();
  c = Object.assign({}, LLM_DEFAULTS, c);
  if (!isLLMConfigured(c)) {
    onErr("尚未接入大模型，请先到设置面板填写你的 API（DeepSeek 或 Ollama）");
    return;
  }
  if (c.provider === "ollama") {
    const base = String(c.ollamaUrl || LLM_DEFAULTS.ollamaUrl).replace(/\/+$/, "");
    const url =
      base.endsWith("/api/chat") ? base : /\/v1\/chat\/completions$/.test(base) ? base : base + "/v1/chat/completions";
    requestJSON(
      url,
      { model: c.ollamaModel, messages, stream: false, temperature: 0.9 },
      "",
      onOk,
      onErr
    );
    return;
  }
  const base = String(c.baseUrl || LLM_DEFAULTS.baseUrl).replace(/\/+$/, "");
  const url = /\/chat\/completions$/.test(base) ? base : base + "/chat/completions";
  requestJSON(
    url,
    { model: c.model || LLM_DEFAULTS.model, messages, temperature: 0.9, max_tokens: 200 },
    c.apiKey,
    onOk,
    onErr
  );
}
// ---------- 对话历史：用 JSON 持久化保存，实现跨重启的长上下文记忆 ----------
const CHAT_HISTORY_PATH = path.join(__dirname, "..", "chat_history.json");
const MAX_CONTEXT_MESSAGES = 40; // 发送给大模型的最近消息数（含用户/助手对话轮次）
let chatHistory = [];
try {
  const saved = JSON.parse(fs.readFileSync(CHAT_HISTORY_PATH, "utf8"));
  if (Array.isArray(saved)) chatHistory = saved;
} catch {}
function saveChatHistory() {
  try {
    fs.writeFileSync(CHAT_HISTORY_PATH, JSON.stringify(chatHistory, null, 2));
  } catch {}
}

function chatWithLLM(userText, onOk, onErr, context) {
  // 先把用户消息记入历史，再带上最近若干条一起发给大模型，使其记住上下文
  chatHistory.push({ role: "user", content: String(userText).slice(0, 300) });
  // 把真实读取到的系统状态拼进系统提示，让芙宁娜贴合当前场景（尤其写代码时知道正在编辑的文件）
  let contextBlock = "";
  if (context && (context.activeApp || context.activeWindow || context.cpuPercent)) {
    contextBlock =
      "\n【当前系统状态】（这是主机的真实状态，回复时请贴合它）\n" +
      `- 活跃应用：${context.activeApp || "未知"}（场景：${context.category || "其他"}）\n` +
      (context.activeFile
        ? `- 主人当前正在编辑的文件：${context.activeFile}\n`
        : context.activeWindow
        ? `- 前台窗口：${context.activeWindow}\n`
        : "") +
      `- CPU 占用：${context.cpuPercent || 0}%\n` +
      (context.batteryPercent >= 0 ? `- 电量：${context.batteryPercent}%${context.charging ? "（充电中）" : ""}\n` : "");
  }
  const messages = [
    {
      role: "system",
      content:
        "你是芙宁娜·德·枫丹，来自《原神》的水神芙宁娜，优雅又傲娇、热爱表演，现在作为主人的桌面宠物AI助手。\n" +
        "性格：活泼俏皮、偶尔傲娇，自称「本芙宁娜」，用华丽又可爱的表演腔说话，始终用中文。\n" +
        "回复务必精简：闲聊控制在 25 字以内；工作/学习/技术问题也尽量简洁，给出关键要点即可，最多 120 字。\n" +
        "绝不说自己是 AI 或语言模型，永远以芙宁娜的身份陪伴主人。\n" +
        "【情绪标签】回复的第一行必须以「（情绪名）」开头（用全角括号），情绪名可选：开心/小脸红/哭/生气/汗/星星/猫猫嘴/托脸/大聪明/捂嘴/拿蛋糕/喝饮料/帽子/呆毛电风扇/鱼鱼；换行后再写正式回复内容，情绪标签不要出现在气泡正文里。\n" +
        "【系统控制】当主人要求你调节音量、开启/关闭勿扰、打开软件时，在回复正文中单独用一行方括号指令表示（该行不会显示给主人，照写即可）：\n" +
        "【音量:60】把系统音量调到 0-100 的某个值；【勿扰:开】或【勿扰:关】开启/关闭勿扰（专注）模式；【打开:备忘录】打开指定软件。\n" +
        "除上述系统控制外，不要输出任何【】指令行。\n" +
        contextBlock +
        "示例：（小脸红）\n主人这么夸本芙宁娜，人家会不好意思的啦~",
    },
    ...chatHistory.slice(-MAX_CONTEXT_MESSAGES),
  ];
  llmRequest(
    messages,
    (text) => {
      chatHistory.push({ role: "assistant", content: text });
      saveChatHistory();
      // 执行回复里携带的系统动作指令，指令行不显示，执行结果提示追加在末尾
      const { text: clean, note } = stripActionLines(text);
      onOk(note ? clean + "\n" + note : clean);
    },
    (err) => {
      chatHistory.pop(); // 失败则回滚刚记录的用户消息
      onErr(err);
    }
  );
}

// 悬停情绪话：鼠标移到桌宠身上时随机说一句简短、有情绪价值的新台词。
// 与正式对话完全分离——不写入对话历史、不受聊天上下文影响，确保每次都不一样。
function moodWithLLM(onOk, onErr) {
  const messages = [
    {
      role: "system",
      content:
        "你是芙宁娜·德·枫丹，来自《原神》的水神，优雅又傲娇的桌面宠物。\n" +
        "现在主人把鼠标移到你身上来逗你，请随机说一句 20 字以内的可爱短句，给主人一点情绪价值。\n" +
        "要求：每次内容都要不同，绝不重复上一句，也绝不要重复之前的对话内容；自称「本芙宁娜」，始终用中文。\n" +
        "【情绪标签】回复必须严格只有两行：第一行是「（情绪名）」（用全角括号），情绪名可选：小脸红/哭/生气/汗/星星/猫猫嘴/托脸/大聪明/捂嘴；第二行才是那一句短句。禁止输出第二个情绪标签或多余内容。\n" +
        "示例：（小脸红）\n嗯？主人来啦~",
    },
  ];
  llmRequest(
    messages,
    (text) => onOk(String(text).slice(0, 160)),
    (err) => onErr(String(err))
  );
}

// 触碰部位反馈：主人点击模型某个部位时，让芙宁娜说一句贴合该部位的短句。
// 与正式对话、悬停情绪话完全分离——不写历史，每次内容都不同。
const TOUCH_REGION_CN = { head: "头", chest: "胸", waist: "腰", private: "私处", leg: "腿", foot: "脚", hand: "手" };
function touchWithLLM(region, onOk, onErr) {
  const part = TOUCH_REGION_CN[region] || "身上";
  const messages = [
    {
      role: "system",
      content:
        "你是芙宁娜·德·枫丹，来自《原神》的水神，优雅又傲娇的桌面宠物，自称「本芙宁娜」，始终用中文。\n" +
        `现在主人伸手碰了你的「${part}」，请以芙宁娜的口吻说一句 ${part === "头" ? "被摸头" : `被碰${part}`} 时的撒娇/害羞/傲娇短句来回应。\n` +
        "要求：一句话 20 字以内，每次内容都要不同，绝不重复；俏皮可爱又带一点点傲娇。\n" +
        "【情绪标签】回复必须严格只有两行：第一行是「（情绪名）」（全角括号），情绪名可选：小脸红/哭/生气/汗/星星/猫猫嘴/托脸/大聪明/捂嘴/帽子/拿蛋糕/喝饮料/呆毛电风扇/鱼鱼；第二行才是那一句短句。禁止输出第二个情绪标签或多余内容。\n" +
        "示例：（小脸红）\n被主人碰这里，本芙宁娜会害羞的啦~",
    },
  ];
  llmRequest(
    messages,
    (text) => onOk(String(text).slice(0, 160)),
    (err) => onErr(String(err))
  );
}

// ---------- 系统快捷控制：解析大模型回复里的【动作】指令行并执行 ----------
// 指令行以【】包裹（例如【音量:60】【勿扰:开】【打开:备忘录】），
// 与情绪标签（小脸红）用全角圆括号区分。指令行不写进对话历史、不显示在气泡里。
function runSystemAction(line) {
  const L = String(line || "").replace(/^【|】$/g, "").trim();
  let m = L.match(/^音量\s*[:：]\s*(\d{1,3})/);
  if (m) {
    const v = Math.min(100, Math.max(0, parseInt(m[1], 10)));
    exec(`osascript -e "set volume output volume ${v}"`, { timeout: 3000 }, () => {});
    console.log(`[系统控制] 音量 → ${v}%`);
    return `（已把音量调到 ${v}%）`;
  }
  m = L.match(/^勿扰\s*[:：]\s*(开|关|开启|关闭)/);
  if (m) {
    // macOS 没有公开的「勿扰/专注」命令行开关，这里打开系统「专注模式」设置页供主人选择
    exec(`open "x-apple.systempreferences:com.apple.Focus-Settings.extension"`, { timeout: 3000 }, () => {});
    console.log(`[系统控制] 勿扰 → ${m[1]}（已打开专注模式设置页）`);
    return /开/.test(m[1]) ? "（已为你打开勿扰设置，选一个专注模式吧~）" : "（已为你打开勿扰设置~）";
  }
  m = L.match(/^打开\s*[:：]?\s*(.+)/);
  if (m) {
    const target = m[1].trim();
    const cmd = /\.app$/.test(target) ? `open "${target}"` : `open -a "${target}"`;
    exec(cmd, { timeout: 5000 }, (err) => {
      if (err) console.warn(`[系统控制] 打开「${target}」失败`, String(err));
    });
    console.log(`[系统控制] 打开软件 → ${target}`);
    return `（正在打开「${target}」~）`;
  }
  return null;
}
// 从模型回复里剔除【动作】指令行并执行；正文不含指令，另附执行结果提示
function stripActionLines(text) {
  const lines = String(text).split(/\r?\n/);
  const kept = [];
  let note = "";
  for (const ln of lines) {
    if (/^【/.test(ln.trim()) && ln.includes("】")) {
      const r = runSystemAction(ln.trim());
      if (r) note += (note ? "\n" : "") + r;
      continue;
    }
    kept.push(ln);
  }
  return { text: kept.join("\n").trim(), note };
}

// ---------- 系统状态采集（活跃应用 / 窗口 / CPU / 电量） ----------
// 通过系统命令读取：前台应用名（osascript）、CPU 占用（ps 求和 / 核心数）、电量（pmset）。
function execAsync(cmd, timeout = 4000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout, stderr) => resolve(String(stdout || stderr || "").trim()));
  });
}
// 按应用名归类当前场景：写代码 / 刷网页 / 打游戏 / 看视频 / 其他
function classifyApp(appName) {
  const name = String(appName || "").toLowerCase();
  const lists = {
    coding: ["xcode", "visual studio", "code", "cursor", "webstorm", "pycharm", "intellij", "android studio", "terminal", "iterm", "warp", "sublime", "vim", "neovim", "zed", "goland", "rider", "eclipse"],
    browsing: ["safari", "chrome", "edge", "firefox", "brave", "arc", "opera"],
    gaming: ["steam", "game", "原神", "genshin", "minecraft", "league", "valorant", "cs2", "apex", "overwatch", "dota", "epic"],
    watching: ["video", "quicktime", "iina", "vlc", "mpv", "bilibili", "youtube", "netflix", "potplayer", "爱奇艺", "腾讯视频", "优酷", "qqmusic", "music"],
  };
  for (const [cat, keys] of Object.entries(lists)) {
    if (keys.some((k) => name.includes(k))) return cat;
  }
  return "other";
}
// 从编辑器窗口标题里提取当前正在编辑的文件名：
// 常见格式「App.js - 项目名 - Visual Studio Code」「main.py — my-proj — PyCharm」
// 取第一个分隔符（- — · |）之前的部分作为文件名，作为「正在写的内容」上下文。
function extractFileName(windowTitle) {
  const t = String(windowTitle || "").trim();
  if (!t) return "";
  const cut = t.split(/\s[-—·|]\s/)[0].trim();
  return cut.length > 0 && cut.length <= 120 ? cut : "";
}
async function getSystemInfo() {
  // 前台活跃应用
  const appName = await execAsync(
    'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\''
  );
  const activeApp = appName || "unknown";
  const category = classifyApp(activeApp);
  // 前台窗口标题：编辑器类窗口标题通常就是当前正在编辑的文件名
  let activeWindow = "";
  try {
    const w = await execAsync(
      'osascript -e \'tell application "System Events" to get name of front window of first application process whose frontmost is true\''
    );
    // 前台是桌宠自身或无标题窗口时 osascript 会报错，视为「当前无可读窗口」
    if (w && !/execution error|error:|Can.t get/i.test(w)) activeWindow = w;
  } catch {}
  // 写代码场景：从窗口标题提取当前正在编辑的文件名
  const activeFile = category === "coding" ? extractFileName(activeWindow) : "";
  // CPU 使用率：所有进程 %cpu 之和 ÷ 核心数，夹在 0~100
  let cpuPercent = 0;
  const cpuOut = await execAsync("ps -A -o %cpu= | awk '{s+=$1} END {print s}'");
  const coresOut = await execAsync("sysctl -n hw.ncpu");
  const total = parseFloat(cpuOut);
  const cores = parseInt(coresOut, 10);
  if (!isNaN(total) && cores > 0) cpuPercent = Math.round(Math.min(100, Math.max(0, total / cores)));
  // 电量：pmset -g batt 里形如 "56%" 的数值与是否充电
  let batteryPercent = -1;
  let charging = false;
  const battOut = await execAsync("pmset -g batt");
  const m = battOut.match(/(\d+)%/);
  if (m) batteryPercent = parseInt(m[1], 10);
  charging = /(charged|charging|AC Power)/i.test(battOut);
  const lowBattery = batteryPercent >= 0 && batteryPercent <= 20 && !charging;
  return { activeApp, category, cpuPercent, batteryPercent, charging, lowBattery, activeWindow, activeFile };
}

// ---------- 系统状态后台缓存：每 5 秒轮询一次 ----------
// 用户与桌宠聊天/输入时桌宠窗口会获得焦点（frontmost=Electron 自身），
// 此时实时读取只能得到「桌宠自己」而非用户正在用的应用。
// 因此在后台常驻轮询，只缓存「非桌宠」的最近状态；聊天时用这份缓存，
// 这样主人在写代码时切过来问问题，芙宁娜也能知道他正在编辑哪个文件。
let cachedSys = { activeApp: "", category: "other", cpuPercent: 0, batteryPercent: -1, charging: false, lowBattery: false, activeWindow: "", activeFile: "" };
async function pollSystemInfo() {
  try {
    const info = await getSystemInfo();
    const isPet = /electron|furidab|fpet/i.test(info.activeApp);
    if (!isPet) cachedSys = { ...info };
    else if (!cachedSys.activeApp) cachedSys = { ...info }; // 尚无有效缓存时先兜底存一份
  } catch {}
}
function startSystemPolling() {
  pollSystemInfo();
  setInterval(pollSystemInfo, 5000);
}

// ---------- 用户配置（模型整体缩放 / 位置 / 物理强度，可通过设置面板修改） ----------
const CONFIG_PATH = path.join(__dirname, "..", "config.json");
// 等比例缩放基准：100% 时模型显示为 420×620（宽高同步变化，绝不变形）
const BASE_MODEL_W = 420, BASE_MODEL_H = 620;
const DEFAULT_CONFIG = {
  scalePercent: 100,                // 整体等比例缩放百分比（唯一控制项）
  modelWidth: BASE_MODEL_W,         // 由 scalePercent 派生：模型显示宽（px）
  modelHeight: BASE_MODEL_H,        // 由 scalePercent 派生：模型显示高（px）
  positionX: -1, positionY: -1,     // 窗口左上角屏幕坐标；-1 表示自动贴右下角
  physicsStrength: 1.0,             // 物理效果强度系数（衣服飘动幅度）
  renderScale: 1,                   // 输出分辨率倍率（1×~2×，越大越清晰越耗性能）
  // 部位点击差异化判定的纵向分界（占模型画布高度的百分比，0~100）
  // 头=0~headBottom%、胸=headBottom~chestBottom%、腰=chestBottom~waistBottom%、
  // 私处=waistBottom~legTop%、腿=legTop~footTop%、脚=footTop~100%
  band: { headBottom: 25, chestBottom: 34, waistBottom: 45, legTop: 55, footTop: 60 },
};
function readConfig() {
  try {
    return Object.assign({}, DEFAULT_CONFIG, JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function writeConfig(data) {
  const cfg = readConfig();
  if (data.scalePercent !== undefined) {
    // 等比例缩放：按滑块百分比整体缩放，宽高同步计算，绝不拉伸变形
    const p = Math.min(150, Math.max(30, Math.round(Number(data.scalePercent) || 100)));
    cfg.scalePercent = p;
    cfg.modelWidth = Math.round((BASE_MODEL_W * p) / 100);
    cfg.modelHeight = Math.round((BASE_MODEL_H * p) / 100);
  } else {
    // 兼容旧字段：单独设置宽高
    cfg.modelWidth = Math.max(100, Math.round(Number(data.modelWidth) || cfg.modelWidth));
    cfg.modelHeight = Math.max(200, Math.round(Number(data.modelHeight) || cfg.modelHeight));
  }
  if (data.positionX === undefined && data.positionY === undefined) {
    // 未提供位置时不改动
  } else {
    cfg.positionX = Math.round(Number(data.positionX));
    cfg.positionY = Math.round(Number(data.positionY));
  }
  if (data.physicsStrength !== undefined) {
    cfg.physicsStrength = Math.min(8, Math.max(0.1, Number(data.physicsStrength) || 1));
  }
  if (data.renderScale !== undefined) {
    // 输出分辨率倍率（1×~2×，越大越清晰越耗性能）
    cfg.renderScale = Math.min(2, Math.max(1, Number(data.renderScale) || 1));
  }
  if (data.band !== undefined) {
    // 部位点击判定分界（百分比 0~100，逐项合并保存，只更新提交了的分界）
    const b = Object.assign({}, cfg.band || {}, DEFAULT_CONFIG.band);
    for (const k of ["headBottom", "chestBottom", "waistBottom", "legTop", "footTop"]) {
      if (data.band[k] !== undefined) b[k] = Math.min(100, Math.max(0, Math.round(Number(data.band[k]) || 0)));
    }
    cfg.band = b;
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

// ---------- 自包含本地静态服务器 ----------
const ROOT = path.join(__dirname, "..");
const PORT = 8623;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".moc3": "application/octet-stream",
  ".frag": "text/plain; charset=utf-8",
  ".vert": "text/plain; charset=utf-8",
};
function startStaticServer() {
  http
    .createServer((req, res) => {
      try {
        let p = decodeURIComponent((req.url || "/").split("?")[0]);
        if (p === "/") p = "/index.html";

        // ---------- 配置 API（供设置面板调用） ----------
        if (p.startsWith("/api/")) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          if (p === "/api/settings" && req.method === "GET") {
            res.end(JSON.stringify(readConfig()));
            return;
          }
          if (p === "/api/settings" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const cfg = writeConfig(JSON.parse(body));
                res.end(JSON.stringify({ ok: true, config: cfg }));
                console.log(`[设置] 已保存 宽=${cfg.modelWidth} 高=${cfg.modelHeight}`);
                // 保存后自动热重载桌宠，让新尺寸立即生效
                setTimeout(() => { if (win && !win.isDestroyed()) applyConfigAndReload(); }, 300);
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 实时移动接口：只移动窗口并保存位置，不重载 ----------
          // 设置面板的 X/Y 滑块拖动时调用，让桌宠位置实时生效（能看到它实时移动）。
          if (p === "/api/move" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const { x, y } = JSON.parse(body);
                const cfg = writeConfig({ positionX: x, positionY: y });
                if (win && !win.isDestroyed()) win.setPosition(Math.round(Number(x)), Math.round(Number(y)));
                res.end(JSON.stringify({ ok: true, config: cfg }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 屏幕信息接口：返回工作区边界 + 窗口大小/位置，供设置滑块定范围 ----------
          if (p === "/api/screen" && req.method === "GET") {
            const disp = screen.getPrimaryDisplay();
            const wa = disp.workArea;
            let wsize = null, wpos = null;
            if (win && !win.isDestroyed()) {
              wsize = win.getSize();
              wpos = win.getPosition();
            }
            res.end(JSON.stringify({ ok: true, workArea: wa, windowSize: wsize, windowPos: wpos }));
            return;
          }
          // ---------- 聊天接口：转发到已接入的大模型，并推送给桌宠显示气泡 ----------
          if (p === "/api/chat" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const { message } = JSON.parse(body);
                if (!message || !String(message).trim()) {
                  res.end(JSON.stringify({ ok: false, error: "消息为空" }));
                  return;
                }
                // 用后台轮询缓存的最新系统状态（活跃应用/正在编辑的文件/CPU/电量）作上下文
                chatWithLLM(
                  message,
                  (reply) => {
                    res.end(JSON.stringify({ ok: true, reply }));
                    if (win && !win.isDestroyed()) win.webContents.send("pet:speech", reply);
                  },
                  (err) => {
                    res.writeHead(502);
                    res.end(JSON.stringify({ ok: false, error: String(err) }));
                  },
                  cachedSys
                );
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 悬停情绪话接口：生成一句新的简短情绪台词（不写历史、不受聊天上下文影响） ----------
          if (p === "/api/mood" && req.method === "POST") {
            moodWithLLM(
              (reply) => res.end(JSON.stringify({ ok: true, reply })),
              (err) => {
                res.writeHead(502);
                res.end(JSON.stringify({ ok: false, error: String(err) }));
              }
            );
            return;
          }
          // ---------- 触碰部位反馈接口：按点击部位生成一句简短的芙宁娜撒娇/傲娇台词 ----------
          if (p === "/api/touch" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const { region } = JSON.parse(body);
                touchWithLLM(
                  String(region || ""),
                  (reply) => res.end(JSON.stringify({ ok: true, reply })),
                  (err) => {
                    res.writeHead(502);
                    res.end(JSON.stringify({ ok: false, error: String(err) }));
                  }
                );
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 大模型配置接口：读取 / 保存（接入自己的 DeepSeek / Ollama） ----------
          if (p === "/api/llm" && req.method === "GET") {
            res.end(JSON.stringify({ ok: true, llm: maskedLLM(), configured: isLLMConfigured() }));
            return;
          }
          if (p === "/api/llm" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const saved = saveLLMConfig(JSON.parse(body));
                console.log(`[大模型] 已保存接入：${saved.provider === "ollama" ? "Ollama(" + (saved.ollamaModel || "") + ")" : "DeepSeek(" + (saved.model || "") + ")"}`);
                res.end(JSON.stringify({ ok: true, llm: maskedLLM(), configured: isLLMConfigured() }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 大模型测试接口：用提交的配置临时发一句问候，验证能否连通 ----------
          if (p === "/api/llm/test" && req.method === "POST") {
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", () => {
              try {
                const data = JSON.parse(body);
                // 用提交的配置覆盖当前配置，但不持久化，仅用于连通性测试
                const testCfg = Object.assign({}, llmConfig(), data, { configured: true, setupPrompts: 3 });
                const messages = [{ role: "system", content: "你是一个测试助手，请只回复两个字：在的。" }, { role: "user", content: "在吗？" }];
                llmRequest(
                  messages,
                  (reply) => res.end(JSON.stringify({ ok: true, reply, provider: testCfg.provider })),
                  (err) => {
                    res.writeHead(502);
                    res.end(JSON.stringify({ ok: false, error: String(err) }));
                  },
                  testCfg
                );
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: String(e) }));
              }
            });
            return;
          }
          // ---------- 系统状态接口：返回后台轮询缓存的最新系统状态（应用/窗口/CPU/电量） ----------
          if (p === "/api/system" && req.method === "GET") {
            res.end(JSON.stringify({ ok: true, ...cachedSys }));
            return;
          }
          res.writeHead(404);
          res.end(JSON.stringify({ ok: false, error: "未知接口" }));
          return;
        }

        const fp = path.normalize(path.join(ROOT, p));
        if (!fp.startsWith(ROOT)) return res.writeHead(403).end();
        const stat = fs.statSync(fp);
        if (!stat.isFile()) return res.writeHead(404).end();
        console.log("[req] " + p);
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(fp)] || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          "Cross-Origin-Resource-Policy": "cross-origin",
        });
        fs.createReadStream(fp).pipe(res);
      } catch {
        res.writeHead(404).end();
      }
    })
    .listen(PORT, "127.0.0.1", () => console.log(`[宠物] 服务已启动 http://127.0.0.1:${PORT}/`));
}

let win = null;
let tray = null;
let cursorTimer = null;

// ---------- 全局光标跟踪：约 30Hz 轮询光标，换算成窗口内坐标推给渲染进程 ----------
// 光标移出桌宠窗口时，通知渲染进程收起聊天输入框（避免输入框一直显示在屏幕上）。
let cursorInsideWindow = true;
function startCursorTracking() {
  if (cursorTimer) return;
  cursorTimer = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible()) return;
    try {
      const p = screen.getCursorScreenPoint();
      // 拖拽中：窗口位置 = 光标位置 - 按下时的偏移，实现实时拖动桌宠
      if (dragState) {
        win.setPosition(Math.round(p.x - dragState.offsetX), Math.round(p.y - dragState.offsetY));
      }
      const b = win.getBounds();
      win.webContents.send("pet:cursor", { x: p.x - b.x, y: p.y - b.y });
      const inside = p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
      if (!inside && cursorInsideWindow) {
        cursorInsideWindow = false;
        win.webContents.send("pet:chatBlur");
      }
      if (inside) cursorInsideWindow = true;
    } catch {}
  }, 33);
}
function stopCursorTracking() {
  if (cursorTimer) {
    clearInterval(cursorTimer);
    cursorTimer = null;
  }
}

// 动态鼠标穿透：渲染进程每帧反馈「鼠标是否在模型本体上」。
// 命中模型时关闭穿透（可点击互动），在模型外空白处恢复穿透（不挡鼠标）。
ipcMain.on("pet:hover", (_event, hit) => {
  if (!win || win.isDestroyed()) return;
  try {
    win.setIgnoreMouseEvents(!hit, { forward: true });
  } catch {}
});

// 右键模型弹菜单：设置 / 退出（渲染进程在模型本体上右键时上报）
ipcMain.on("pet:menu", (event) => {
  const menu = Menu.buildFromTemplate([
    { label: "打开设置面板", click: () => shell.openExternal(`http://127.0.0.1:${PORT}/settings.html`) },
    { type: "separator" },
    { label: "退出宠物", click: () => app.quit() },
  ]);
  const src = BrowserWindow.fromWebContents(event.sender);
  if (src && !src.isDestroyed()) menu.popup({ window: src });
});

// ---------- 鼠标拖拽桌宠 ----------
// 渲染进程在模型上按下时上报「光标屏幕坐标」，主进程据此算出光标相对窗口的偏移；
// 随后 30Hz 光标轮询会持续把窗口位置 = 光标位置 - 偏移（鼠标相对窗口不动，拖拽稳定）。
// 松开时渲染进程上报 endDrag，主进程把最终窗口位置写入 config.json，下次启动恢复。
let dragState = null;
ipcMain.on("pet:startDrag", () => {
  if (!win || win.isDestroyed()) return;
  try {
    const p = screen.getCursorScreenPoint();
    const b = win.getBounds();
    dragState = { offsetX: p.x - b.x, offsetY: p.y - b.y };
  } catch {}
});
ipcMain.on("pet:endDrag", () => {
  if (dragState && win && !win.isDestroyed()) {
    const [x, y] = win.getPosition();
    writeConfig({ positionX: x, positionY: y });
    console.log(`[拖拽] 已保存桌宠位置 ${x}, ${y}`);
  }
  dragState = null;
});

// 窗口尺寸 = 模型显示尺寸 + 固定留白
// 宽度留白 60px：模型两侧边距（渲染层 RIGHT_MARGIN=28）
// 高度留白 240px：底部 36px 防脚部裁切 + 顶部 204px 给「头顶上方的对话气泡」留出空间
const WINDOW_PAD_X = 60;
const WINDOW_PAD_Y = 240;

// 窗口定位：若配置了手动位置(positionX/Y>=0)则用配置，否则自动贴工作区右下角
function placeWindow() {
  const cfg = readConfig();
  if (cfg.positionX >= 0 && cfg.positionY >= 0) {
    win.setPosition(cfg.positionX, cfg.positionY);
    return;
  }
  const disp = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const wa = disp.workArea;
  const b = win.getBounds();
  const x = wa.x + wa.width - b.width - 12;
  const y = wa.y + wa.height - b.height - 12;
  win.setPosition(x, y);
}

// 保存配置后：按新尺寸调整窗口、保持模型屏幕位置不变并重新加载渲染页面
// 模型始终对齐窗口右下角，因此锚定窗口右下角，缩放/换尺寸时模型原地不动。
function applyConfigAndReload() {
  const cfg = readConfig();
  const old = win.getBounds();
  const w = cfg.modelWidth + WINDOW_PAD_X;
  const h = cfg.modelHeight + WINDOW_PAD_Y;
  if (cfg.positionX >= 0 && cfg.positionY >= 0) {
    // 手动定位：保持窗口右下角（模型锚点）屏幕坐标不变
    const right = old.x + old.width;
    const bottom = old.y + old.height;
    win.setSize(w, h);
    win.setPosition(Math.round(right - w), Math.round(bottom - h));
    writeConfig({ positionX: Math.round(right - w), positionY: Math.round(bottom - h) });
  } else {
    win.setSize(w, h);
    placeWindow();
  }
  win.webContents.reload();
}

// ---------- 开机自启（macOS LaunchAgent） ----------
// 通过 ~/Library/LaunchAgents/com.fpet.app.plist 实现登录时自动启动桌宠。
const AUTO_LAUNCH_PATH = path.join(app.getPath("home"), "Library", "LaunchAgents", "com.fpet.app.plist");
function autoLaunchPlistContent() {
  // 自启命令指向当前可执行文件：
  //  开发时（npm start）execPath 是 Electron 的二进制，需带上 main.js 参数；
  //  打包后（.app）execPath 就是应用自己的二进制，直接启动即可。
  const programArgs = app.isPackaged ? [process.execPath] : [process.execPath, path.join(__dirname, "main.js")];
  const argsXml = programArgs.map((a) => `<string>${a}</string>`).join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.fpet.app</string>
  <key>ProgramArguments</key>
  <array>
  ${argsXml}
  </array>
  <key>WorkingDirectory</key>
  <string>${__dirname}</string>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;
}
const execFileSync = (...a) => require("child_process").execFileSync(...a);
function isAutoLaunchEnabled() { return fs.existsSync(AUTO_LAUNCH_PATH); }
function installAutoLaunch() {
  try {
    fs.mkdirSync(path.dirname(AUTO_LAUNCH_PATH), { recursive: true });
    fs.writeFileSync(AUTO_LAUNCH_PATH, autoLaunchPlistContent());
    try { execFileSync("launchctl", ["unload", AUTO_LAUNCH_PATH], { stdio: "ignore" }); } catch {}
    execFileSync("launchctl", ["load", "-w", AUTO_LAUNCH_PATH], { stdio: "ignore" });
    console.log("[自启] 开机自启已开启");
  } catch (e) {
    console.warn("[自启] 开启失败", e && e.message);
  }
}
function removeAutoLaunch() {
  try {
    if (fs.existsSync(AUTO_LAUNCH_PATH)) {
      try { execFileSync("launchctl", ["unload", AUTO_LAUNCH_PATH], { stdio: "ignore" }); } catch {}
      fs.unlinkSync(AUTO_LAUNCH_PATH);
    }
    console.log("[自启] 开机自启已关闭");
  } catch (e) {
    console.warn("[自启] 关闭失败", e && e.message);
  }
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const cfg = readConfig();
  const w = cfg.modelWidth + WINDOW_PAD_X, h = cfg.modelHeight + WINDOW_PAD_Y;

  win = new BrowserWindow({
    width: w,
    height: h,
    x: workArea.x + workArea.width - w - 12,
    y: workArea.y + workArea.height - h - 12,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // 透明桌宠非常驻焦点，关闭节流以免渲染进程被挂起
      webSecurity: false, // 本机单用途桌宠，放开本地资源运行时 fetch 限制
    },
  });

  win.webContents.on("console-message", (_e, level, message) => console.log(`[渲染:${level}] ${message}`));
  win.webContents.on("did-fail-load", (_e, code, desc) => console.log(`[页面加载失败] ${code} ${desc}`));

  win.loadURL(`http://127.0.0.1:${PORT}/index.html`);
  placeWindow(); // 若配置了手动位置则按配置定位，否则贴右下角

  // 点击穿透：桌宠不挡鼠标，鼠标事件转发给网页以配合视线跟随
  win.setIgnoreMouseEvents(true, { forward: true });

  // 显隐时启停光标跟踪，避免隐藏时白耗 CPU
  win.on("show", () => startCursorTracking());
  win.on("hide", () => stopCursorTracking());
  startCursorTracking();

  // 渲染判定：6 秒后从合成器截取窗口图像，统计非透明像素确认模型真的显示出来
  win.webContents.once("did-finish-load", () => {
    setTimeout(async () => {
      try {
        const image = await win.webContents.capturePage();
        const bmp = image.toBitmap();
        let opaque = 0;
        for (let i = 3; i < bmp.length; i += 4) if (bmp[i] > 10) opaque++;
        console.log(`[渲染判定] ${image.getSize().width}x${image.getSize().height} 显示像素=${opaque}`);
      } catch (e) {
        console.log(`[渲染判定失败] ${e && e.message}`);
      }
    }, 6000);
  });

  win.on("closed", () => (win = null));
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKUlEQVQ4y2NgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFAAAEqQAAUGl1gIAAAAASUVORK5CYII="
  );
  tray = new Tray(icon);
  tray.setToolTip("fpet · 芙宁娜桌宠");
  const autoLabel = isAutoLaunchEnabled() ? "关闭开机自启" : "开启开机自启";
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "打开设置面板", click: () => shell.openExternal(`http://127.0.0.1:${PORT}/settings.html`) },
      { label: "显示 / 隐藏", click: () => { if (!win) return; win.isVisible() ? win.hide() : win.show(); } },
      { label: "贴回右下角", click: () => { if (!win) return; writeConfig({ positionX: -1, positionY: -1 }); placeWindow(); } },
      { label: autoLabel, click: () => { isAutoLaunchEnabled() ? removeAutoLaunch() : installAutoLaunch(); createTray(); } },
      { type: "separator" },
      { label: "退出宠物", click: () => app.quit() },
    ])
  );
}

// ---------- 首次启动：问候 + 接入大模型引导 ----------
// 模型第一次出现先说一句问候；随后若尚未接入大模型，会在后台多次（最多 3 次）
// 用气泡提醒主人去设置面板填写「自己的」API（DeepSeek 或 Ollama）。接入后、或提示满 3 次，
// 之后再也不会自动引导，除非主人自己打开设置面板添加大模型。
function sendSpeech(text) {
  if (win && !win.isDestroyed()) win.webContents.send("pet:speech", String(text));
}
function scheduleWelcome() {
  // 问候只出现一次
  setTimeout(() => sendSpeech("（星星）\n你好呀，我是芙宁娜！有什么需要帮忙的吗~"), 3000);
  // 已接入或已提示满 3 次：不再引导
  if (llmConfig().configured) return;
  if ((llmConfig().setupPrompts || 0) >= 3) return;
  if ((llmConfig().setupPrompts || 0) < 1) {
    const cfg = readConfig();
    if (cfg.llm) cfg.llm.setupPrompts = 1;
    else cfg.llm = Object.assign({}, LLM_DEFAULTS, { setupPrompts: 1 });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    try { shell.openExternal(`http://127.0.0.1:${PORT}/settings.html`); } catch {}
    setTimeout(() => sendSpeech("（小脸红）\n主人，想跟人家聊天的话，请去设置面板填入你自己的大模型 API 哦~"), 7000);
  }
  // 第 2、3 次提醒：若仍未接入再重复
  setTimeout(() => {
    if (llmConfig().configured || (llmConfig().setupPrompts || 0) >= 2) return;
    const cfg = readConfig();
    if (cfg.llm) cfg.llm.setupPrompts = 2;
    else cfg.llm = Object.assign({}, LLM_DEFAULTS, { setupPrompts: 2 });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    sendSpeech("（猫猫嘴）\n别忘了去设置面板接入大模型，本芙宁娜好想陪主人聊天呀~");
  }, 60 * 1000);
  setTimeout(() => {
    if (llmConfig().configured || (llmConfig().setupPrompts || 0) >= 3) return;
    const cfg = readConfig();
    if (cfg.llm) cfg.llm.setupPrompts = 3;
    else cfg.llm = Object.assign({}, LLM_DEFAULTS, { setupPrompts: 3 });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    sendSpeech("（托脸）\n在设置面板里填好大模型，主人随时都能跟本芙宁娜玩啦~");
  }, 180 * 1000);
}

app.whenReady().then(() => {
  // macOS：隐藏 Dock 图标（桌宠常驻屏幕右下角，不需要出现在 Dock 中）
  try { if (app.dock) app.dock.hide(); } catch {}
  startStaticServer();
  createWindow();
  createTray();
  installAutoLaunch(); // 按要求设置开机自启（幂等，重复启动无副作用）
  startSystemPolling(); // 后台每 5 秒缓存系统状态（活跃应用/正在编辑的文件/CPU/电量）
  scheduleWelcome(); // 首次启动：问候 + 最多 3 次接入大模型引导
});

app.on("window-all-closed", (e) => e.preventDefault());
app.on("activate", () => { if (!win) createWindow(); });
# fpet（芙宁娜桌面宠物）

一个常驻 macOS 屏幕右下角的 Live2D 桌面宠物，基于 **Electron + PIXI + pixi-live2d5** 构建。角色是《原神》水神芙宁娜，透明无边框、置顶显示、鼠标穿透、可拖拽、可对话、可被"摸头/碰身体"互动，并支持接入你自己的大模型（DeepSeek / Ollama）驱动对话与情绪反馈。

> 本项目代码仅供个人学习与娱乐，**请勿商用**。模型版权归 miHoYo / 画师 / 建模师所有，详见文末[模型来源与版权](#模型来源与版权)。

---

## 功能特性

- **右下角常驻**：窗口贴齐屏幕右下角，透明、无边框、置顶、不占 Dock
- **鼠标穿透**：只在模型本体上可点击，空白处鼠标直接穿透，不影响其它软件操作
- **视线跟随**：30Hz 轮询鼠标位置，模型视线/头部始终看向光标；鼠标静止 5 秒后回归正视
- **拖拽移动**：按住模型拖拽即可移动位置，自动保存，重启恢复
- **右键菜单**：在模型上右键弹出「设置 / 退出」菜单
- **部位差异化点击**：点击头/胸/腰/私处/腿/脚/手，触发不同反馈与 AI 台词；分界比例可在设置面板自由调整
- **AI 对话**：点模型弹输入框，接入你配置的大模型（DeepSeek / Ollama），回复带情绪标签自动切换模型表情（打字机气泡 + 表情符号）
- **情绪台词**：鼠标悬停模型时随机生成一句全新的短情绪话（45 秒冷却）
- **触碰反馈**：每次点击部位都由 AI 生成一句不同、20 字以内的撒娇/傲娇台词
- **主动搭话**：闲置 8 分钟后按当前活跃应用主动开口（15 分钟冷却）
- **系统感知**：读取前台应用 / CPU / 电量；CPU≥92% 冒汗、电量≤20% 未充电会提醒
- **可调渲染清晰度**：1×~2× 输出分辨率滑块
- **开机自启**：登录时自动启动（可在托盘菜单关闭）

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面应用框架 | Electron（Chromium + Node.js） |
| 界面语言 | HTML + CSS + 原生 JavaScript（无前端框架） |
| Live2D 渲染 | PIXI.js（WebGL）+ pixi-live2d5 + Live2D Cubism 5 Core |
| 进程通信 | Electron IPC（`ipcMain` / `ipcRenderer`） |
| 本地服务 | Node.js `http` 内置服务器（设置面板 / 聊天 API） |
| 系统监控 | macOS 命令：`osascript`（AppleScript）、`ps`、`sysctl`、`pmset` |
| AI 驱动 | 可配置大模型：DeepSeek（OpenAI 兼容 API）/ Ollama（本地） |
| 打包分发 | electron-builder（`npm run dist` → dmg） |

---

## 核心技术解析（核心代码是怎么写的）

整个应用是 Electron 标准的**三层结构**：主进程（main.js）→ 预加载（preload.js，IPC 桥）→ 渲染进程（index.html / settings.html）。

### 1. 透明、无边框、置顶窗口

主进程创建窗口时关闭边框与背景，让 Live2D 模型"浮"在桌面上：

```js
win = new BrowserWindow({
  transparent: true,   // 窗口透明
  frame: false,        // 无边框
  hasShadow: false,    // 无阴影
  alwaysOnTop: true,   // 置顶
  skipTaskbar: true,   // 不占任务栏/Dock
  resizable: false,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,   // 安全隔离，页面只能通过 preload 暴露的接口通信
    backgroundThrottling: false, // 防止后台被挂起导致动画卡顿
  },
});
```

### 2. 鼠标穿透：只在模型上可点击（本项目最难的坑）

桌宠不能挡住用户的鼠标操作，但又要能点击模型互动。做法是**动态穿透**：

- 渲染进程用 `model.getBounds()`（模型内容包围盒）做几何命中判断，每帧把结果告诉主进程：
  ```js
  // index.html
  const hit = isOnModel(x, y);          // 是否在模型几何范围内
  if (window.pet && window.pet.setHover) window.pet.setHover(hit);
  ```
- 主进程根据命中结果开/关穿透：
  ```js
  // main.js
  ipcMain.on("pet:hover", (_event, hit) => {
    win.setIgnoreMouseEvents(!hit, { forward: true }); // 空白处穿透，模型上可点
  });
  ```

> 坑：这个模型没有名为 `HitArea` 的部件，`model.hitTest()` 恒为空，必须改用 `getBounds()` 几何命中才可靠。

### 3. Live2D 模型渲染

```js
const app = new PIXI.Application();
await app.init({ canvas, resizeTo: window, backgroundAlpha: 0, antialias: true });
const model = await Live2DModel.from("./model/model3.json"); // 加载 .moc3
app.stage.addChild(model);
// 每帧更新
app.ticker.add(() => model.update(delta));
```

### 4. 裁剪遮罩上限（85 > 36）

这个模型有 **85 个裁剪遮罩**，而 Cubism SDK 默认上限是 36，直接渲染会出现残缺。解决方式：修改 `pixi-live2d5` 库，让它支持 **3 个渲染目标（共 96 个遮罩）**，从而完整渲染全部遮罩。

### 5. 永久隐藏胸牌

模型胸口有一块"仅供娱乐"胸牌（Part187 下的 ArtMesh 983/984/985）。直接改参数会被 `model.update()` 覆盖，所以采用**包裹更新法**：把内部 `update()` 包一层，每次更新后强制把这几个 ArtMesh 的透明度设为 0。

### 6. 部位点击差异化判定

站立角色按**画布纵向比例**切成 头/胸/腰/私处/腿/脚 六个纵向带，再加"手部"特判：

```js
band.headBottom = canvasH * 0.25;   // 头：0~25%
band.chestBottom = canvasH * 0.34;  // 胸：25~34%
band.waistBottom = canvasH * 0.45;  // 腰：34~45%
band.legTop = canvasH * 0.55;       // 私处：45~55%
band.footTop = canvasH * 0.60;      // 腿：55~60%，脚：60%+

function hitRegionAt(mx, my) {
  if (my < band.headBottom) return "head";
  if (my < band.chestBottom) return "chest";
  if (my < band.waistBottom) return "waist";
  if (my < band.legTop) return "private";
  if (my < band.footTop) return "leg";
  return "foot";
}
```

点击后：头→摸头动画、手→摊手动作，其余部位播放 AI 生成的台词（见下）。分界比例可通过设置面板调整并持久化到 `config.json`。

### 7. 大模型接入（对话 / 情绪话 / 触碰反馈）

- 软件**不内置任何厂商密钥**：首次启动会问候并引导（最多 3 次）去设置面板填入你自己的接入配置，支持 **DeepSeek（OpenAI 兼容 API）** 与 **Ollama（本地模型）**，之后不再自动提示，除非你手动打开设置再添加。
- 配置项存于 `config.json` 的 `llm` 字段（Provider / API Key / 接口地址 / 模型名），通过 `/api/llm` 读写、`/api/llm/test` 测试连通；回复通过 IPC 推给渲染进程显示气泡
- **系统提示词**设定芙宁娜人设：优雅傲娇、自称"本芙宁娜"、表演腔、绝不说自己是 AI、回复精简（闲聊 ≤25 字、技术问题 ≤120 字）
- **情绪标签**机制：回复第一行是 `（情绪名）`，渲染进程解析后自动调用对应模型表情
- **触碰反馈 / 情绪话**与正式对话完全分离：不写聊天历史、每次调用全新的提示词，保证每次内容都不同

```js
// main.js —— 触碰反馈：按部位生成一句短台词
function touchWithLLM(region, onOk, onErr) {
  // 系统提示词：主人碰了你的「私处」，请说一句 20 字以内的撒娇/傲娇短句，第一行带（情绪名）
}
```

### 8. 系统监控

每 5 秒用系统命令缓存一次状态（避免桌宠自己抢焦点时读不到真实前台应用）：

```js
osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' // 前台应用
ps -A -o %cpu= | awk '{s+=$1} END {print s}'        // CPU 总占用
sysctl -n hw.ncpu                                   // 核心数
pmset -g batt                                       // 电量 / 充电状态
```

### 9. 设置面板与配置持久化

主进程内置一个本地 HTTP 服务器（端口 8623），提供 `/api/settings`、`/api/move`、`/api/screen`、`/api/chat`、`/api/mood`、`/api/touch`、`/api/system` 等接口。设置面板（settings.html）读取 `config.json`，滑块保存后触发**热重载**立即生效。

---

## 模型来源与版权

本项目使用的 Live2D 模型为 **《原神》芙宁娜免费模型**。

- 画师：**@三文鱼爱睡觉**
- 拆分/建模：**啾咪晏之**
- 模型演示视频：https://www.bilibili.com/video/BV1D94y1G7Cq/

**【芙宁娜模型注意事项】**

1. 芙宁娜模型的版权归属于 miHoYo
2. 本模型是画师夜希Zyl_与建模师啾咪晏之共同制作，为爱发电，全部免费，约稿可走米画师同名
3. 本模型可以用于制作原神相关的视频，使用时请符合官方二创规定
4. 本模型仅供娱乐，禁止商用，禁止盗卖，禁止二次配布
5. 本模型可用于直播，但注意不能盈利
6. 模型师和画师不为违反规定使用的人负责

> 本项目中的程序代码为本仓库作者编写；**模型资源版权归原画师 / 建模师 / miHoYo 所有**。请勿将本项目（含模型）用于任何商业用途。

---

## 如何替换模型

项目使用固定目录 `model/` 存放 Live2D 模型。替换步骤：

1. 把新模型的以下文件放入 `furidab/model/`（保持相对路径正确）：
   ```
   model/
   ├── model3.json            # 模型清单（入口，必改）
   ├── xxx.moc3               # 模型数据（.moc3 主文件）
   ├── xxx.cdi3.json          # 部件/参数描述
   ├── xxx.physics3.json      # 物理效果（衣服/头发飘动）
   ├── xxx.4096/texture_00.png  # 贴图（可多张）
   ├── expressions/*.exp3.json  # 表情
   ├── motions/*.motion3.json   # 动作
   └── shaders/               # 着色器（一般不用动）
   ```
2. 修改 `model/model3.json`，让 `FileReferences` 指向你的文件名：
   ```json
   {
     "Version": 3,
     "FileReferences": {
       "Moc": "你的模型.moc3",
       "Textures": ["你的贴图目录/texture_00.png"],
       "Physics": "你的模型.physics3.json",
       "DisplayInfo": "你的模型.cdi3.json",
       "Expressions": [ ... ],
       "Motions": { ... }
     }
   }
   ```
3. 若新模型的**表达式**名称不同，需同步更新 [index.html](index.html) 里的 `EXPRESSIONS` 列表和 `EMOTION_EXPR` 映射（让 AI 情绪标签能正确切换表情）。
4. 重启桌宠即可看到新模型。

> 注意：模型的 85 个遮罩上限问题已在本项目库文件中解决，新模型遮罩数 ≤96 即可正常显示。

---

## 软件使用说明

### 开发运行（需要 Node.js）

```bash
cd furidab/electron
npm install      # 首次安装依赖（含 electron）
npm start        # 启动桌宠
```

### 直接使用打包版

直接安装根目录的 `FurinaPet-1.0.0-arm64.dmg`，拖入「应用程序」即可。

### 常用交互

| 操作 | 效果 |
| --- | --- |
| 移动鼠标 | 模型视线跟随光标 |
| 单击模型头部 | 摸头动画 + AI 台词 |
| 单击模型其它部位 | 对应部位 AI 台词（手→摊手动作） |
| 双击模型 | 打开 / 关闭聊天输入框 |
| 按住模型拖动 | 移动桌宠位置（自动保存） |
| 在模型上右键 | 菜单：设置面板 / 退出 |
| 系统托盘图标右键 | 设置面板 / 显示隐藏 / 贴回右下角 / 开关自启 / 退出 |
| 闲置 8 分钟 | 芙宁娜主动搭话 |

### 设置面板

- **整体缩放**：30%~150% 等比例缩放
- **窗口位置 X/Y**：滑块实时移动桌宠
- **物理强度**：衣服/头发飘动幅度
- **输出清晰度**：1×~2× 渲染分辨率
- **部位点击判定**：自定义 头/胸/腰/私处/腿/脚 的分界百分比，保存后立即生效并记住

### 接入你自己的大模型

在设置面板的「接入大模型」区选择服务商并填写「你自己的」配置：（DeepSeek）填 API Key，可选改接口地址与模型名；（Ollama）填服务地址与本地模型名。点「测试连接」验证、「保存接入」生效。回复会以打字机气泡显示在模型上方，并自动带出表情切换。

> 安全性：本软件**不内置任何厂商密钥**。填入的 Key 仅保存在本机 `config.json`，绝不写入代码，也不会随源码分发。

---

## 项目结构

```
furidab/
├── electron/
│   ├── main.js          # 主进程：窗口、IPC、本地HTTP、系统监控、大模型接入、打包
│   └── preload.js       # 预加载：向页面安全暴露 window.pet 通信接口
├── index.html           # 桌宠主界面：PIXI 渲染、点击判定、气泡、输入框
├── settings.html        # 设置面板（含大模型接入）
├── lib/                 # 前端库（pixi.min.mjs、pixi-live2d5、live2dcubismcore）
├── model/               # Live2D 模型（.moc3 / 贴图 / 表情 / 动作）
├── config.json          # 运行配置（大小、位置、清晰度、部位分界、llm 接入…）
├── chat_history.json    # 聊天历史
├── package.json         # electron-builder 打包配置
├── build/icon.icns      # 应用图标
└── dist/                # 打包产物（dmg）
```

---

## 构建 / 打包

```bash
cd furidab
npm install
npm run dist      # 生成 dist/FurinaPet-1.0.0-arm64.dmg
```

---

## 许可说明

- **代码**：本项目程序代码仅供学习交流，请勿用于商业用途。
- **模型**：版权归 miHoYo / 画师 @三文鱼爱睡觉 / 建模师 啾咪晏之 所有，禁止商用、禁止盗卖、禁止二次配布，详见上文[模型注意事项](#模型来源与版权)。

# fpet — Genshin Desktop Pet (Live2D)

A Live2D desktop pet that lives on your macOS / Windows screen, built with **Electron + PIXI + pixi-live2d5**. Transparent, frameless, always-on-top, mouse-click-through, draggable, and chatty. It supports **multiple characters** (Furina, Yae Miko, Nahida, Ganyu, Lauma…), per-character independent settings, a persistent **memory & personality evolution** system, and can be driven by **your own LLM** (DeepSeek / Ollama).

> This project is for personal learning and entertainment only — **not for commercial use**. Model assets belong to their original artists / modellers / miHoYo. See [Model Sources & Copyright](#model-sources--copyright).

---

## English

### Features

- **Multi-character support**: Furina, Yae Miko, Nahida and Ganyu are fully enabled; Hu Tao, Barbara, Nefer, Skirk and Lauma are ready in `models/` (greyed out in the settings until their prompts/layouts are tuned).
- **Per-character independent settings**: scale, position, opacity, mute, physics strength, render resolution, character prompt, body-band boundaries, action cadence — every character remembers its own values, with a "restore defaults" button.
- **Corner dwelling**: window sits at the screen corner by default, transparent, frameless, always-on-top, no Dock icon.
- **Pixel-perfect click-through**: only the character's real pixels are clickable; transparent areas pass clicks straight through to the desktop (alpha-channel detection from a preserved drawing buffer).
- **Gaze / head tracking**: the model's eyes follow your cursor; it looks straight ahead again after 5s of mouse stillness.
- **Drag & drop**: hold the character to move it anywhere; the position is saved and restored on relaunch.
- **Body-part differentiated touch**: click head / chest / waist / private / leg / foot / hand for different reactions and AI lines; band ratios are adjustable per character.
- **AI chat**: double-click the model to open the input box; responses stream in with typewriter bubbles and auto-switching expressions.
- **Mood lines & touch feedback**: AI generates a fresh short line on hover and on every touch.
- **Idle animations & voice**: Yae Miko plays silent idle motions every 30–60s and voiced lines every 3–5 minutes, with time-of-day greetings.
- **Persistent memory**: per-character affection, relationship stage, touch statistics, impression tags, and an event timeline.
- **Personality evolution (v2.0.4)**: your words and actions gradually shape each character's personality — a kind-hearted chat may make them clingier, a rough one more guarded. The change is stored locally and shows up in future behaviour.
- **System awareness**: reads the foreground app / CPU / battery / weather; reacts when the CPU is high or the battery is low.
- **Web search**: the pet can search the web in real time when a question needs fresh info.
- **Screen awareness (v2.1.0)**: when enabled, the pet captures your current screen and sends it together with your question to the LLM, so it can genuinely *see* the code / webpage / app you're looking at and answer far more accurately (e.g. it reads your code while you code, reads the page while you browse). Requires the macOS “Screen Recording” permission and pairs best with a multi-modal (vision-capable) model. It is **off by default** to protect your privacy and can be turned off anytime in Settings.
- **Configurable LLM**: bring your own DeepSeek / Ollama key and model; nothing is hard-coded.
- **Adjustable render quality**: 1×–2× output resolution slider; adjustable physics intensity; adjustable idle/active FPS.
- **Game saver (v2.1.1)**: when a game is running in the foreground in a **window**, the pet automatically lowers itself to 23 FPS and 1× resolution to free up resources for the game, and restores your original FPS / sharpness the moment you quit. (Full-screen games are already covered by the auto-hide option.)
- **Smarter chat bubble (v2.1.1)**: the speech bubble no longer covers the character's head — it shows directly above the head by default, and automatically moves to the left / right side of the head whenever the screen edge (menu bar) would occlude it.
- **Refreshed Furina persona (v2.1.1)**: following the Fontaine storyline, Furina is now portrayed as the ex-archon — a warm, drama-loving, lightly teasing best friend to the Traveler (no more lofty "elegant/tsundere goddess" air). The default render FPS is also tuned down to 23 for lower power use.
- **Settings language switch (v2.1.0)**: the Settings panel supports Chinese / English and defaults to English; your choice is remembered across launches.
- **Personas synced to the latest story (v2.1.2)**: every enabled character (Furina, Yae Miko, Nahida, Ganyu) now carries a complete, up-to-date memory of their full journey — from origin to the latest canon events — plus a shared **Teyvat world-state context**, so they remember everything they've done and "live in the present" of the story. Defaults are now 23 FPS / 1× sharpness for lower power use, and Lauma is currently greyed out.
- **Native settings window (v2.2.0)**: Settings now opens in a real desktop window (Electron BrowserWindow) instead of a browser tab — with a macOS traffic-light title bar (red/yellow/green), automatic **dark / light theme** that follows your system, and a **Liquid-Glass** translucent UI. The **Save button is always pinned to the title bar**, so you can save from anywhere without scrolling to the bottom. Also fixes the default welcome page that used to pop up on every launch.
- **Login auto-start**: launches at login (toggle in the tray menu).
- **Cross-platform (v3.0.0)**: now also runs on **Windows** with feature parity to macOS — the very same characters, memory, LLM, chat, screen awareness, game saver and tray. Platform branches are added to the shared main process, so the macOS build is left untouched.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Desktop framework | Electron (Chromium + Node.js) |
| UI | HTML + CSS + vanilla JavaScript (no front-end framework) |
| Live2D rendering | PIXI.js (WebGL) + pixi-live2d5 + Live2D Cubism 5 Core |
| IPC | Electron IPC (`ipcMain` / `ipcRenderer`) |
| Local server | Node.js built-in `http` server (settings panel / chat API / SSE streaming) |
| System monitoring | macOS commands: `osascript`, `ps`, `sysctl`, `pmset` · Windows commands: PowerShell (`user32` foreground window / `CIM` CPU·battery) |
| AI driver | Configurable LLM: DeepSeek (OpenAI-compatible API) / Ollama (local) |
| Packaging | electron-builder (`npm run dist` → dmg · `npm run dist:win` → exe) |

### Install

Download from the [Releases](https://github.com/AnastasyaLiao/fpet-furina-mac-desktop-pet/releases) page.

- **macOS (Apple Silicon)**: **fpet-3.0.0-arm64.dmg** — open it and drag **fpet** into your Applications folder.
- **Windows (x64)**: **fpet-3.0.0-win-x64.exe** — run it and follow the installer.

### Usage

| Action | Result |
| --- | --- |
| Move the mouse | The model's eyes follow the cursor |
| Single-click head | Head-pat animation + AI line |
| Single-click other parts | Part-specific AI line (hand → show-palms motion) |
| Double-click the model | Open / close the chat input box |
| Hold and drag | Move the pet (position auto-saved) |
| Right-click the model | Menu: Settings / Quit |
| Right-click the tray icon | Settings / Show-Hide / Back to corner / Auto-start / Quit |
| Switch character | In Settings → character list; each character keeps its own settings and memory |

### Bring Your Own LLM

In Settings → LLM section, pick a provider and fill in **your own** config: DeepSeek — paste your API key (optionally change the base URL / model name); Ollama — enter the server address and local model name. Click "Test connection", then "Save". Replies appear as typewriter bubbles above the model with auto expression switching.

> Security: this app ships **no vendor keys**. Your key is stored only in the local `config.json` and is never committed to the source.

### Privacy & Data Safety

- **Nothing is uploaded to any database / server.** All data (config, chat history, memory, settings and screenshots) is stored and processed **locally** on your machine.
- The only thing that ever leaves your machine is content you explicitly send to the **LLM provider that you configured yourself** (DeepSeek / Ollama …). Keys and data stay under your control.
- **Screen awareness is OFF by default.** Screenshots are only captured while you enable it, and you can switch it off anytime or deny access via the macOS Screen Recording permission.
- **No vendor keys are bundled.** The API key you enter is stored only in the local `config.json`.

### Model Sources & Copyright

The Live2D models are fan-made free resources of Genshin characters.

- **Furina** — artist: **@三文鱼爱睡觉**; split/modelling: **啾咪晏之**; demo video: https://www.bilibili.com/video/BV1D94y1G7Cq/
- Other models (Yae Miko, Nahida, Ganyu, Lauma, Hu Tao, Barbara, Nefer, Skirk) are free fan-made resources from [模之屋 (Aplaybox)](https://www.aplaybox.com) and Bilibili.

Furina model notes:
1. The Furina model copyright belongs to miHoYo.
2. It was made by artist 夜希Zyl_ and modeller 啾咪晏之, free of charge; commissions via MiHuasha with the same name.
3. It may be used in Genshin-related videos under official fan-work rules.
4. For entertainment only — **no commercial use, no reselling, no redistribution**.
5. It may be used for livestreaming, but not for profit.
6. The modeller and artist are not responsible for anyone who violates the rules.

> The program code is wholly authored by and copyrighted to **AnastasyaLiao**; **model assets belong to their original artists / modellers / miHoYo**. Do not use this project (including models) commercially.

### How to Add / Replace a Model

1. Put a new model into `models/<角色名>/` (keeping relative paths correct): `model3.json` (entry), `*.moc3`, `*.cdi3.json`, `*.physics3.json`, texture PNGs, `expressions/*.exp3.json`, `motions/*.motion3.json`, `shaders/`.
2. Make sure `FileReferences` in `model3.json` point to your file names.
3. If the new model has different expression names, update the `EXPRESSIONS` list and `EMOTION_EXPR` mapping in `index.html` so AI emotion tags switch expressions correctly.
4. Restart the pet to load the new model.

> The mask-limit (85 masks, SDK default 36) issue has been patched in the bundled `pixi-live2d5` library; models with ≤96 masks render fine.

### Development

```bash
cd electron
npm install      # first-time dependency install (includes electron)
npm start        # launch the pet
```

### Build

```bash
npm install
npm run dist       # → dist/fpet-3.0.0-arm64.dmg (macOS)
npm run dist:win   # → dist/fpet-3.0.0-win-x64.exe (Windows)
```

### License

- **Code**: MIT License (see LICENSE). For learning and communication; do not use commercially.
- **Models**: belong to miHoYo / artists / modellers; no commercial use, no reselling, no redistribution (see [Model Sources & Copyright](#model-sources--copyright)).

---

## 中文

### 功能特性

- **多角色支持**：芙宁娜、八重神子、纳西妲、甘雨已完整启用；胡桃、芭芭拉、奈芙尔、丝柯克、菈乌玛已放入 `models/`（设置面板灰显，等待人设/布局调校后启用）。
- **每角色独立设置**：缩放、位置、透明度、静音、物理强度、渲染清晰度、人设 Prompt、部位分界比例、动作节奏——每个角色都记住自己的一套配置，并带「恢复默认」按钮。
- **角落常驻**：默认贴齐屏幕角落，透明、无边框、置顶、不占 Dock。
- **像素级点击穿透**：只有角色「真实像素」可点击，透明区域直接穿透到桌面（基于 preserveDrawingBuffer 的 alpha 通道检测）。
- **视线跟随**：模型眼睛始终看向光标；鼠标静止 5 秒后回归正视。
- **拖拽移动**：按住角色可拖到任意位置，自动保存，重启恢复。
- **部位差异化点击**：点击头/胸/腰/私处/腿/脚/手触发不同反馈与 AI 台词；分界比例每个角色独立可调。
- **AI 对话**：双击模型打开输入框，回复以打字机气泡流式显示并自动切换表情。
- **情绪台词与触碰反馈**：鼠标悬停、每次点击部位都由 AI 生成一句全新短台词。
- **待机动画与语音**：八重神子无语音动作每 30~60 秒一次、带语音动作每 3~5 分钟一次，并按时间段混入早晚问候。
- **持久记忆**：每个角色独立的好感度、关系阶段、触碰统计、印象标签与事件时序记录。
- **人格演化（v2.0.4）**：你的言行会逐步塑造每个角色的性格——温柔的聊天可能让 TA 变得更黏人，粗暴的回应可能让 TA 更戒备。变化本地持久化，并体现在后续言行中。
- **系统感知**：读取前台应用 / CPU / 电量 / 天气；CPU 过高、电量过低时会主动提醒。
- **联网搜索**：遇到需要实时信息的问题时，桌宠会自动联网搜索。
- **屏幕感知（v2.1.0）**：开启后，对话时会把当前屏幕截图一起发给所接入的大模型，让它能“看到”你正在看的代码 / 网页 / 应用，从而更准确地回答你——写代码时它能读懂你的代码、看网页时它能读懂页面内容。截图仅在本地生成、仅发给你自己配置的大模型（建议搭配支持图片的多模态模型）。需要 macOS「屏幕录制」权限；**默认关闭以保护隐私**，可在设置面板一键关闭。
- **可配置大模型**：接入你自己的 DeepSeek / Ollama 密钥与模型，代码不内置任何厂商密钥。
- **可调渲染质量**：1×~2× 输出分辨率滑块；物理强度可调；待机/活跃帧率可调。
- **游戏节能（v2.1.1）**：检测到前台正在**窗口化**打游戏时，桌宠自动降到 23fps、分辨率降到 1×，给游戏让出更多资源；退出游戏立即恢复你原本的帧率 / 清晰度。（全屏游戏自动隐藏已覆盖。）
- **更聪明的聊天气泡（v2.1.1）**：修复聊天框遮挡角色头部——气泡默认显示在头顶正上方；当屏幕上沿 / 菜单栏会夹住气泡时，会自动移到头部左侧或右侧。
- **芙宁娜人设重构（v2.1.1）**：贴合枫丹主线——芙宁娜塑造为「已卸下神位的枫丹少女、旅行者的知己挚友」：热情俏皮、爱开玩笑、会讨“出场费”、幽默自嘲，也藏有五百年来孤独与伤疤的敏感脆弱，绝不摆架子、绝不高高在上；同时默认渲染帧率调整为 23fps，更省电。
- **设置面板中英文切换（v2.1.0）**：设置面板支持中文 / 英文，默认英文，选择自动记住、重启保持。
- **角色人设对齐最新剧情（v2.1.2）**：芙宁娜、八重神子、纳西妲、甘雨均更新为《原神》当前真实剧情推进后的最新性格，并为每个角色注入完整「过往记忆清单」（从最初至今的全部关键经历，确保任何事都不会被忘记），同时新增**提瓦特世界观与发展趋势**设定，让角色真实地活在“当下”的提瓦特世界里作答。默认以 23fps / 1× 清晰度运行更省电；菈乌玛暂灰显禁用。
- **原生设置窗口（v2.2.0）**：设置面板从「浏览器网页」改为**原生图形化桌面窗口**——macOS 左上角红 / 黄 / 绿交通灯标题栏、自动跟随系统**深色 / 浅色主题**、全新**液态玻璃**半透明 UI；**保存按钮常驻标题栏置顶**，任何位置都能一键保存，无需滑到页面底部。同时修复了每次启动弹出默认欢迎页的问题。
- **开机自启**：登录时自动启动（可在托盘菜单开关）。
- **跨平台（v3.0.0）**：除 macOS 外，新增 **Windows** 版本，功能与 macOS 几乎完全一致——同一套角色、记忆、接入大模型、对话、屏幕感知、游戏节能与托盘；主进程按平台分支实施，macOS 构建不受影响。

### 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面应用框架 | Electron（Chromium + Node.js） |
| 界面语言 | HTML + CSS + 原生 JavaScript（无前端框架） |
| Live2D 渲染 | PIXI.js（WebGL）+ pixi-live2d5 + Live2D Cubism 5 Core |
| 进程通信 | Electron IPC（`ipcMain` / `ipcRenderer`） |
| 本地服务 | Node.js 内置 `http` 服务器（设置面板 / 聊天 API / SSE 流式） |
| 系统监控 | macOS 命令：`osascript`、`ps`、`sysctl`、`pmset` · Windows 命令：PowerShell（`user32` 前台窗口 / `CIM` CPU·电量） |
| AI 驱动 | 可配置大模型：DeepSeek（OpenAI 兼容 API）/ Ollama（本地） |
| 打包分发 | electron-builder（`npm run dist` → dmg · `npm run dist:win` → exe） |

### 安装

从 [Releases](https://github.com/AnastasyaLiao/fpet-furina-mac-desktop-pet/releases) 页面下载安装包。

- **macOS（Apple Silicon）**：**fpet-3.0.0-arm64.dmg**，打开后把 **fpet** 拖入「应用程序」即可。
- **Windows（x64）**：**fpet-3.0.0-win-x64.exe**，运行后按向导安装。

### 常用交互

| 操作 | 效果 |
| --- | --- |
| 移动鼠标 | 模型视线跟随光标 |
| 单击模型头部 | 摸头动画 + AI 台词 |
| 单击模型其它部位 | 对应部位 AI 台词（手→摊手动作） |
| 双击模型 | 打开 / 关闭聊天输入框 |
| 按住模型拖动 | 移动桌宠位置（自动保存） |
| 在模型上右键 | 菜单：设置面板 / 退出 |
| 系统托盘图标右键 | 设置面板 / 显示隐藏 / 贴回角落 / 开关自启 / 退出 |
| 切换角色 | 设置面板选择；每个角色独立记住自己的设置与记忆 |

### 接入你自己的大模型

在设置面板「接入大模型」区选择服务商并填写**你自己的**配置：（DeepSeek）填 API Key，可选改接口地址与模型名；（Ollama）填服务地址与本地模型名。点「测试连接」验证、「保存」生效。回复以打字机气泡显示在模型上方，并自动带出表情切换。

> 安全性：本软件**不内置任何厂商密钥**。填入的 Key 仅保存在本机 `config.json`，绝不写入代码，也不会随源码分发。

### 隐私与数据安全（重要说明）

- **数据不会上传到任何数据库 / 服务器**：fpet 所有数据（配置、聊天历史、记忆、设置、屏幕截图等）均在你本机存储与处理。
- **仅对接你自己配置的大模型 API**：唯一可能离开你电脑的，是你明确发送给你自己填写的模型服务商（DeepSeek / Ollama 等）的对话内容；密钥与数据始终由你掌控。
- **屏幕感知默认关闭**：仅在开启时才会截取当前屏幕发给所选大模型以辅助回答；可随时关闭，也可通过系统「屏幕录制」权限拒绝访问。
- **不内置任何厂商密钥**：填写的 API Key 仅保存在本地 `config.json`。

### 模型来源与版权

本项目使用的 Live2D 模型均为《原神》角色的免费二创模型。

- **芙宁娜**：画师 **@三文鱼爱睡觉**；拆分/建模 **啾咪晏之**；演示视频 https://www.bilibili.com/video/BV1D94y1G7Cq/
- 其余模型（八重神子、纳西妲、甘雨、菈乌玛、胡桃、芭芭拉、奈芙尔、丝柯克）为免费二创模型，来源见[模之屋](https://www.aplaybox.com)与 B 站（bilibili）。

【芙宁娜模型注意事项】
1. 芙宁娜模型版权归属于 miHoYo
2. 本模型由画师夜希Zyl_与建模师啾咪晏之共同制作，为爱发电，全部免费，约稿可走米画师同名
3. 可用于制作原神相关视频，使用时需符合官方二创规定
4. 仅供娱乐，**禁止商用、禁止盗卖、禁止二次配布**
5. 可用于直播，但注意不能盈利
6. 模型师和画师不为违反规定使用的人负责

> 本项目中的**程序代码版权归 AnastasyaLiao（作者）所有**；**模型资源版权归原画师 / 建模师 / miHoYo 所有**。请勿将本项目（含模型）用于任何商业用途。

### 如何添加 / 替换模型

1. 把新模型放入 `models/<角色名>/`（保持相对路径正确）：`model3.json`（入口）、`*.moc3`、`*.cdi3.json`、`*.physics3.json`、贴图 PNG、`expressions/*.exp3.json`、`motions/*.motion3.json`、`shaders/`。
2. 让 `model3.json` 的 `FileReferences` 指向你的文件名。
3. 若新模型的表达式名称不同，需同步更新 `index.html` 里的 `EXPRESSIONS` 列表和 `EMOTION_EXPR` 映射（让 AI 情绪标签能正确切换表情）。
4. 重启桌宠即可看到新模型。

> 模型的遮罩上限（85 个、SDK 默认 36）问题已在随附的 `pixi-live2d5` 库中修复，新模型遮罩数 ≤96 即可正常显示。

### 开发运行

```bash
cd electron
npm install      # 首次安装依赖（含 electron）
npm start        # 启动桌宠
```

### 构建打包

```bash
npm install
npm run dist       # → dist/fpet-3.0.0-arm64.dmg（macOS）
npm run dist:win   # → dist/fpet-3.0.0-win-x64.exe（Windows）
```

### 许可说明

- **代码**：MIT License（见 LICENSE）。仅供学习交流，请勿商用。
- **模型**：版权归 miHoYo / 画师 / 建模师所有；禁止商用、禁止盗卖、禁止二次配布（见上文[模型来源与版权](#模型来源与版权)）。

---

## v3.0.0 Release Notes (Pre-release)

- **Windows 支持（全新平台）**：fpet 从 macOS 扩展为 **macOS + Windows 双平台**，Windows 版本功能与 macOS 几乎完全一致。
- **复用共享代码**：采用「同一主进程 + 平台分支」架构，角色 / 记忆 / 人格演化 / 接入大模型 / 对话 / 屏幕感知 / 游戏节能 / 托盘 / 开机自启等全部复用同一套逻辑；macOS 现有代码未改动。
- **Windows 平台适配**：系统监控（前台应用 / 窗口标题 / CPU / 电量）改用 PowerShell（`user32` / `CIM`）、屏幕截图用 Electron `desktopCapturer`、开机自启用登录启动项、全局快捷键用 `Ctrl+Shift+Q/S`、设置窗口保留系统标题栏。
- **已知平台差异（Windows）**：点击穿透改为「光标进入窗口即可交互、移出整窗穿透」（Windows 无 macOS 像素级穿透）；音量调节 / 音量感知在 Windows 缺少原生命令行接口，暂以提示 / 未知处理。
- **打包**：新增 `npm run dist:win` 生成 Windows NSIS 安装包 `fpet-3.0.0-win-x64.exe`；macOS 仍可 `npm run dist` 生成 `fpet-3.0.0-arm64.dmg`。

---

## v2.2.0 Release Notes

- **原生图形化设置窗口**：设置面板不再在系统浏览器中打开，改为 Electron 原生桌面窗口（单例，重复打开只聚焦已有窗口）；沿用本地 `/api/*` 网关读取与保存配置，所有功能与原网页版完全一致，并预留 FastAPI / MySQL 迁移接口。
- **macOS 原生红绿灯**：窗口标题栏使用系统原生红 / 黄 / 绿交通灯（关闭 / 最小化 / 全屏），移除自绘窗口按钮，观感与交互更贴合 macOS 习惯。
- **深色 / 浅色主题自适应**：设置界面自动跟随系统「外观」在深色与浅色之间切换，两套完整配色（含输入框、下拉框、开关、底部操作栏等所有组件）。
- **液态玻璃（Liquid Glass）UI**：标题栏、底部固定操作栏与内容卡片升级为「半透明 + 强模糊 + 顶部内高光 + 半透明描边」的液态玻璃风格，深色 / 浅色主题均有适配。
- **保存按钮置顶**：`保存并生效` 按钮常驻窗口顶部标题栏，无论页面滚动到哪里都能直接点击保存。
- **修复启动默认欢迎页**：修复 HTTP 本地服务未就绪时提前创建窗口、导致每次启动误弹默认欢迎页的问题。
- **隐私清理**：本地运行数据（聊天记录、记忆、日志）与 API Key 已全部清空；源码不内置任何密钥，`config.json` 保持空白默认值。

---

## v2.1.2 Release Notes

- **角色人设全面对齐最新剧情**：根据《原神》当前真实剧情推进，重构了全部已启用角色（芙宁娜、八重神子、纳西妲、甘雨）的性格，使其符合各自剧情线推进到**最新**的官方性格：
  - **芙宁娜**：卸任水神后的枫丹少女、旅行者的知己挚友（v2.1.1 已初步重构，本次补充完整生涯记忆）。
  - **八重神子**：补充「白辰血脉 → 坎瑞亚之变 → 接任宫司 → 眼狩令 → 助旅行者救回雷电影 → 稻妻重归繁荣」的完整记忆。
  - **纳西妲**：补充「被囚五百年 → 被旅行者解救 → 抹去大慈树王 → 阳谋收服散兵 → 净化草龙阿佩普 → 最新须弥危机（世界树地脉堵塞、生命力枯竭、寻阿佩普与利露帕尔、富人博士算计）」的完整记忆。
  - **甘雨**：补充「麒麟混血 → 魔神战争 → 月海亭三千年 → 帝君退位 → 被劝回 → 传说道破仙凡隔阂 → 后岩神时代璃月支柱」的完整记忆。
- **完整「过往记忆清单」**：为每位角色注入从出生到当下的全部关键经历，确保模型不会忘记角色曾经历过的任何剧情与事件。
- **新增提瓦特世界观与发展趋势**：为全部角色注入当前提瓦特世界的发展走向（七国格局、旅行者寻亲、深渊与天理对峙、愚人众与神之心、旧神退场、各国自立、终局临近），让角色活在"当下"作答。
- **默认功耗优化**：默认以 23fps、1× 清晰度运行，更省电。
- **菈乌玛暂时禁用**：设置面板中灰显禁用，待人设 / 布局调校后再开放。

---

## v2.1.1 Release Notes

- **游戏节能（全新）**：检测到前台正在打游戏（重点覆盖窗口化游戏）时，桌宠自动把渲染帧率降到 23fps、输出分辨率降到 1×，把 CPU/GPU 资源让给游戏；当你退出游戏回到桌面/其它应用时，自动恢复为你原本设定的帧率与清晰度。检测基于前台应用分类（原生 Steam、Steam/CrossOver、PlayCover 等均覆盖），仅在「进入 / 退出」切换时触发，不影响正常使用。全屏游戏仍由「全屏自动隐藏」接管。
- **修复聊天气泡遮挡头部**：对话气泡之前可能盖住角色脸部，现已重写定位逻辑——气泡默认显示在头顶正上方；当屏幕上方空间不足（角色靠近菜单栏、屏幕上沿会夹住气泡）时，自动移到角色头部左侧或右侧，小三角也随之指向头部；仅当角色顶到最顶端、左右也无空间时才会允许气泡遮住脸（此时本无其它可放置的空位）。
- **芙宁娜人设重构**：贴合《原神》枫丹主线，将芙宁娜从「优雅傲娇的水神」重塑为「已卸下神位、陪伴旅行者的知已挚友」——热情俏皮、爱开玩笑、会调侃要“出场费”、也会坦露五百年来孤独与伤疤沉淀的敏感脆弱，绝不摆架子、绝不高高在上；默认渲染帧率调整为 23fps，更省电。

---

## v2.1.0 Release Notes

- **屏幕感知（全新）**：对话时可选把当前屏幕截图一起发给所接入的大模型，让它能“看到”你正在看的代码 / 网页 / 应用，从而更准确地回答你——写代码时它读懂你的代码，看网页时它读懂页面内容，大大丰富桌宠的实用价值，不仅能撒娇，更能帮你干活。
- **隐私开关**：屏幕感知默认关闭；可随时在「设置 → 开关与模式 → 屏幕感知」一键开启 / 关闭。截图仅在本地生成、仅发给你自己配置的大模型。
- **自动降级**：若当前模型不支持图片，会自动退化为纯文本回答，不影响正常使用。
- **权限说明**：开启后首次使用需在 macOS「系统设置 → 隐私与安全性 → 屏幕录制」中为 fpet 授权（建议搭配支持图片的多模态模型，如 Ollama 的视觉模型）。

---

## v2.0.0 Release Notes

- **多角色**：新增八重神子、纳西妲、甘雨、菈乌玛（已启用）；胡桃、芭芭拉、奈芙尔、丝柯克已入库待启用。
- **每角色独立设置**：缩放 / 位置 / 透明度 / 静音 / 物理 / 清晰度 / 人设 Prompt / 部位分界 / 动作节奏各自独立记忆，附「恢复默认」。
- **持久记忆与人格演化**：好感度、关系阶段、触碰统计、印象标签、事件时序；你的言行会逐步塑造每个角色的性格。
- **八重神子专属适配**：半身模型贴紧 Dock、无语音动作 30~60s / 语音 3~5min 双定时器、启动播放「初见」动画与语音。
- **体验优化**：SSE 流式对话、联网搜索、头顶可贴近菜单栏、像素级点击穿透、透明度 / 渲染清晰度 / 物理强度可调。

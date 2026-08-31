// ============================================================
//  fpet —— 原神桌面宠物（预加载脚本）
//  程序著作权声明：本程序全部代码著作权归 AnastasyaLiao 所有。
//  本软件仅供个人学习与娱乐使用，禁止商用、盗卖、二次配布。
//  模型资源版权归原画师 / 建模师 / miHoYo 所有。
// ============================================================
// 预加载脚本：把主进程推送的「全局光标位置」安全暴露给页面使用
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pet", {
  // 订阅光标位置（窗口内相对坐标，即 CSS 像素，可直接用于 model.focus）
  onCursor: (callback) => {
    ipcRenderer.on("pet:cursor", (_event, point) => {
      callback(point.x, point.y);
    });
  },
  // 订阅主进程推送的对话文本（来自已接入的大模型），用于在桌宠上显示气泡
  onSpeech: (callback) => {
    ipcRenderer.on("pet:speech", (_event, text) => {
      callback(text);
    });
  },
  // 订阅「光标移出桌宠窗口」事件，用于自动收起聊天输入框
  onChatBlur: (callback) => {
    ipcRenderer.on("pet:chatBlur", () => {
      callback();
    });
  },
  // 通知主进程：鼠标是否位于模型本体上（true=可点击互动，false=空白处穿透）
  setHover: (hit) => {
    ipcRenderer.send("pet:hover", hit);
  },
  // 右键模型：让主进程弹出「设置 / 退出」菜单
  openMenu: () => {
    ipcRenderer.send("pet:menu");
  },
  // 鼠标拖拽桌宠：按下时上报光标屏幕坐标，松开时让主进程保存最终位置
  startDrag: (x, y) => {
    ipcRenderer.send("pet:startDrag", { x, y });
  },
  endDrag: () => {
    ipcRenderer.send("pet:endDrag");
  },
});
/** 轻量 Toast 消息服务（替代 naive useMessage） */
import { createApp, reactive } from "vue";

type MessageType = "success" | "warning" | "error" | "info";

interface Msg {
  id: number;
  type: MessageType;
  text: string;
}

const list = reactive<Msg[]>([]);
let seq = 0;
let hostEl: HTMLElement | null = null;
let hostApp: ReturnType<typeof createApp> | null = null;

function render() {
  if (!hostEl) return;
  hostEl.innerHTML = "";
  for (const m of list) {
    const item = document.createElement("div");
    item.className = `ui-message-item ui-message-item--${m.type}`;
    item.textContent = m.text;
    hostEl.appendChild(item);
  }
}

function ensureHost() {
  if (hostEl) return;
  hostEl = document.createElement("div");
  hostEl.className = "ui-message-host";
  document.body.appendChild(hostEl);
  const style = document.createElement("style");
  style.textContent = `
.ui-message-host{position:fixed;top:0.12rem;left:0;right:0;z-index:4000;display:flex;flex-direction:column;align-items:center;gap:0.04rem;pointer-events:none;}
.ui-message-item{background:rgba(255,255,255,0.97);border-radius:0.06rem;padding:0.05rem 0.11rem;font-size:0.08rem;color:#333;box-shadow:0 0.02rem 0.08rem rgba(0,0,0,0.12);max-width:80vw;text-align:center;border-left:0.02rem solid #ccc;}
.ui-message-item--success{border-left-color:#42b983;}
.ui-message-item--warning{border-left-color:#e0a458;}
.ui-message-item--error{border-left-color:#e56b6b;}
.ui-message-item--info{border-left-color:#6a9fd8;}
`;
  document.head.appendChild(style);
  if (!hostApp) {
    hostApp = createApp({});
    hostApp.mount(document.createElement("div"));
  }
}

function show(type: MessageType, text: string, duration = 2400) {
  ensureHost();
  const id = ++seq;
  list.push({ id, type, text });
  render();
  setTimeout(() => {
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) list.splice(i, 1);
    render();
  }, duration);
}

export const uiMessage = {
  success: (t: string) => show("success", t),
  warning: (t: string) => show("warning", t),
  error: (t: string) => show("error", t),
  info: (t: string) => show("info", t),
};

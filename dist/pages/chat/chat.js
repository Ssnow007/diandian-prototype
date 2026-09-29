import { toast } from "../../shared/ui.js";
export function createChat(template, { close, nativeKeyboard }) {
  const el = document.createElement("div");
  el.className = `chat-overlay${nativeKeyboard ? " native-keyboard" : ""}`;
  el.hidden = true;
  el.innerHTML = template;
  const input = el.querySelector("textarea"),
    form = el.querySelector("form"),
    send = el.querySelector(".chat-send"),
    messages = el.querySelector(".chat-messages"),
    panel = el.querySelector(".chat-panel");
  const drafts = new Map(),
    conversations = new Map();
  let key = "",
    source = "search",
    composing = false,
    attachment = null,
    returnFocus = null;
  function resize() {
    input.style.height = "48px";
    input.style.height = Math.min(114, Math.max(48, input.scrollHeight)) + "px";
    send.disabled = !input.value.trim() && !attachment;
  }
  function save() {
    if (key) drafts.set(key, input.value);
  }
  function focus() {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }
  function bubble(text, type, url) {
    const b = document.createElement("div");
    b.className = `chat-message ${type}`;
    b.textContent = text;
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "已选择的图片";
      b.append(img);
    }
    messages.append(b);
    messages.scrollTop = messages.scrollHeight;
  }
  function addMessage(record) {
    if (!conversations.has(key)) conversations.set(key, []);
    conversations.get(key).push(record);
    bubble(record.text, record.type, record.url);
  }
  function clearAttachment() {
    if (attachment) URL.revokeObjectURL(attachment.preview);
    attachment = null;
    el.querySelector(".chat-attachment").hidden = true;
    el.querySelector(".chat-file").value = "";
    resize();
  }
  function submit(e) {
    e?.preventDefault();
    if (composing || (!input.value.trim() && !attachment)) return;
    const text = input.value.trim();
    const url = attachment ? URL.createObjectURL(attachment.file) : null;
    addMessage({ text, type: "user", url });
    input.value = "";
    save();
    clearAttachment();
    addMessage({
      text: "已收到。这是交互原型演示，暂未连接真实 AI 服务。",
      type: "assistant",
    });
    resize();
    focus();
  }
  input.addEventListener("input", () => {
    resize();
    save();
  });
  input.addEventListener("compositionstart", () => (composing = true));
  input.addEventListener("compositionend", () => {
    composing = false;
    resize();
    save();
  });
  input.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing &&
      !composing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      submit();
    }
  });
  form.onsubmit = submit;
  el.querySelector("[data-close]").onclick = close;
  el.querySelector(".chat-backdrop").onclick = close;
  el.querySelector("[data-more]").onclick = () =>
    toast("输入内容会保留为本次浏览的草稿");
  el.querySelector(".chat-keyboard").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    focus();
  });
  el.querySelector(".chat-send").addEventListener("pointerdown", (e) =>
    e.preventDefault(),
  );
  el.querySelector(".chat-add").onclick = () =>
    el.querySelector(".chat-file").click();
  el.querySelector(".chat-file").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("请选择图片");
      return;
    }
    clearAttachment();
    attachment = { file, preview: URL.createObjectURL(file) };
    const box = el.querySelector(".chat-attachment");
    box.replaceChildren(document.createTextNode(file.name));
    const b = document.createElement("button");
    b.textContent = "移除";
    b.onclick = clearAttachment;
    box.append(b);
    box.hidden = false;
    resize();
  };
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const controls = [
        ...panel.querySelectorAll("button:not(:disabled),textarea"),
      ].filter((x) => x.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  return {
    el,
    open(question, from, { autofocus = true } = {}) {
      returnFocus = document.activeElement;
      source = from;
      key = `${source}:${question}`;
      input.value = drafts.has(key) ? drafts.get(key) : question;
      messages.replaceChildren();
      for (const m of conversations.get(key) || [])
        bubble(m.text, m.type, m.url);
      el.hidden = false;
      panel.classList.remove("opening");
      void panel.offsetWidth;
      panel.classList.add("opening");
      resize();
      if (autofocus) focus();
    },
    hide() {
      save();
      input.blur();
      el.hidden = true;
      clearAttachment();
      if (returnFocus?.isConnected && returnFocus.tagName !== "INPUT")
        returnFocus.focus({ preventScroll: true });
    },
    get source() {
      return source;
    },
    get isOpen() {
      return !el.hidden;
    },
    viewportChanged(isOpen) {
      el.classList.toggle("keyboard-open", isOpen);
    },
  };
}

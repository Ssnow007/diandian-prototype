import { statusBar, image, esc, toast } from "../../shared/ui.js";
import { nativeKeyboard } from "../../shared/viewport.js";
import { startDeck } from "./deck.js";
export const features = [
  {
    title: "种草推荐",
    question: "2026夏天流行的穿搭风格",
    bg: "ai-img2.svg",
    arrow: "ai-img4.svg",
  },
  {
    title: "出行攻略",
    question: "帮我规划本地温泉3日游",
    bg: "ai-img5.svg",
    arrow: "ai-img6.svg",
  },
  {
    title: "好物测评",
    question: "毕业季礼物送什么合适",
    bg: "ai-img7.svg",
    arrow: "ai-img8.svg",
  },
];
export const questions = [
  "干唇必入的保湿口红有哪些",
  "第一次去京都住哪里比较方便",
  "对比 iPhone17 和 iPhone18",
];
export function createAI(template, { navigate }) {
  const el = document.createElement("section");
  el.className = "page ai-page";
  el.innerHTML = statusBar() + template;
  el.querySelector(".ai-cards").innerHTML = features
    .map(
      (f) =>
        `<button class="ai-card" data-question="${esc(f.question)}">${image("ai-img1.svg", "ai-card-shadow")}${image(f.bg, "ai-card-bg")}${image("ai-img3.svg", "ai-card-border")}<span class="ai-card-copy"><strong>${f.title}</strong><span>${f.question}</span></span>${image(f.arrow, "ai-card-arrow")}</button>`,
    )
    .join("");
  el.querySelector(".ai-questions").innerHTML = questions
    .map(
      (q) =>
        `<button class="ai-question" data-question="${esc(q)}">${image("ai-imgGroup229.svg")}<span>${q}</span>${image("ai-imgGroup98.svg")}</button>`,
    )
    .join("");
  el.querySelector("[data-close]").onclick = () => navigate("home", "left");
  el.querySelector("[data-more]").onclick = () =>
    toast("点点 · 小红书 AI 助手");
  const input = el.querySelector(".ai-input");
  const form = el.querySelector(".ai-composer");
  const send = el.querySelector(".ai-send");
  const content = el.querySelector(".ai-content");
  const conversation = el.querySelector(".ai-conversation");
  const loading = el.querySelector(".ai-loading");
  const empty = el.querySelector(".ai-empty");
  const progress = el.querySelector(".ai-progress");
  const keyboard = el.querySelector(".ai-keyboard");
  const voiceIcon = el.querySelector(".ai-voice img");
  let busy = false,
    composing = false,
    stopDeck = null,
    hasMessages = false;
  el.classList.toggle("ai-native", nativeKeyboard);
  function updateInput() {
    input.style.height = "48px";
    input.style.height = `${Math.min(114, input.scrollHeight)}px`;
    send.disabled = busy || !input.value.trim();
  }
  function edit(question) {
    if (busy) return;
    if (question !== undefined) input.value = question;
    el.classList.add("ai-editing");
    keyboard.hidden = nativeKeyboard;
    voiceIcon.src = "assets/chat-imgIcon2.svg";
    el.querySelector(".ai-voice").setAttribute("aria-label", "添加内容");
    updateInput();
    // Synchronous focus inside the original user gesture activates iOS input.
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
    if (!hasMessages)
      requestAnimationFrame(() => {
        content.scrollTop = 292;
      });
  }
  function endEditing() {
    input.blur();
    el.classList.remove("ai-editing");
    keyboard.hidden = true;
    voiceIcon.src = "assets/ai-imgIcon.svg";
    el.querySelector(".ai-voice").setAttribute("aria-label", "语音输入");
  }
  function finish() {
    busy = false;
    stopDeck = null;
    loading.hidden = true;
    empty.hidden = false;
    el.removeAttribute("aria-busy");
    input.disabled = false;
    updateInput();
  }
  function submit(question) {
    const text = (question ?? input.value).trim();
    if (!text || busy || composing) return;
    busy = true;
    hasMessages = true;
    input.value = "";
    endEditing();
    content.hidden = true;
    conversation.hidden = false;
    empty.hidden = true;
    const bubble = document.createElement("p");
    bubble.className = "ai-message-bubble";
    bubble.textContent = text;
    el.querySelector(".ai-message-list").append(bubble);
    loading.hidden = false;
    el.setAttribute("aria-busy", "true");
    input.disabled = true;
    updateInput();
    stopDeck?.();
    progress.setAttribute("aria-valuenow", "0");
    progress.firstElementChild.style.width = "0%";
    stopDeck = startDeck(
      [...el.querySelectorAll(".ai-deck-card")],
      (p) => {
        progress.firstElementChild.style.width = `${p * 100}%`;
        progress.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      },
      finish,
    );
    requestAnimationFrame(() => {
      conversation.scrollTop = conversation.scrollHeight;
    });
  }
  el.querySelectorAll(".ai-card").forEach(
    (b) => (b.onclick = () => edit(b.dataset.question)),
  );
  el.querySelectorAll(".ai-question").forEach(
    (b) => (b.onclick = () => submit(b.dataset.question)),
  );
  input.addEventListener("focus", () => {
    if (!el.classList.contains("ai-editing")) edit();
  });
  input.addEventListener("input", updateInput);
  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", () => {
    composing = false;
    updateInput();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      endEditing();
      return;
    }
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
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });
  el.querySelector(".ai-voice").onclick = () => {
    if (el.classList.contains("ai-editing")) toast("当前原型支持文字提问");
    else {
      edit();
      toast("当前原型支持文字输入");
    }
  };
  el.querySelector(".ai-camera").onclick = () => {
    edit();
    toast("当前原型支持文字提问");
  };
  let played = false;
  return {
    el,
    onHide() {
      endEditing();
      if (busy) {
        stopDeck?.();
        finish();
      }
    },
    onShow() {
      if (!played) {
        el.classList.add("play-intro");
        played = true;
      }
    },
  };
}

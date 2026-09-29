import { createHome } from "./pages/home/home.js";
import { createAI } from "./pages/ai/ai.js";
import { createSearch } from "./pages/search/search.js";
import { createChat } from "./pages/chat/chat.js";
import { updateTime } from "./shared/ui.js";
import { nativeKeyboard, installViewport } from "./shared/viewport.js";
// All page modules and templates are loaded before interaction. Opening a dialog is
// synchronous inside the click handler so iOS preserves its keyboard activation.
const templates = Object.fromEntries(
  await Promise.all(
    ["home", "ai", "search", "chat"].map(async (name) => {
      const r = await fetch(`pages/${name}/${name}.html`);
      if (!r.ok) throw new Error(`Cannot load ${name}`);
      return [name, await r.text()];
    }),
  ),
);
const root = document.querySelector("#page-root");
let current = "home";
let overlayEntry = false;
const api = { navigate, openChat };
const pages = {
  home: createHome(templates.home, api),
  ai: createAI(templates.ai, api),
  search: createSearch(templates.search, api),
};
for (const p of Object.values(pages)) {
  p.el.hidden = true;
  root.append(p.el);
}
const chat = createChat(templates.chat, { close: closeChat, nativeKeyboard });
document.querySelector("#overlay-root").append(chat.el);
function show(name, transition = "fade") {
  if (!pages[name]) name = "home";
  if (chat.isOpen) hideChat();
  pages[current]?.onHide?.();
  current = name;
  for (const [id, p] of Object.entries(pages)) {
    p.el.hidden = id !== name;
    p.el.inert = id !== name;
    p.el.classList.remove("enter-fade", "enter-left", "enter-right");
  }
  const page = pages[name];
  void page.el.offsetWidth;
  page.el.classList.add(`enter-${transition}`);
  page.onShow?.();
  updateTime();
}
function navigate(name, transition = "fade") {
  show(name, transition);
  history.pushState({ page: name }, "", `#/${name}`);
  overlayEntry = false;
}
function openChat(question = "", source = current) {
  if (chat.isOpen) return;
  pages[source]?.onHide?.();
  root.inert = true;
  root.setAttribute("aria-hidden", "true");
  chat.open(question, source);
  history.pushState(
    { page: source, chat: true, question },
    "",
    `#/chat?from=${source}&q=${encodeURIComponent(question)}`,
  );
  overlayEntry = true;
}
function hideChat() {
  chat.hide();
  root.inert = false;
  root.removeAttribute("aria-hidden");
  pages[current]?.onShow?.();
}
function closeChat() {
  if (!chat.isOpen) return;
  if (overlayEntry) {
    history.back();
  } else {
    const source = chat.source;
    hideChat();
    history.replaceState({ page: source }, "", `#/${source}`);
  }
}
function route() {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  if (path === "chat") {
    const params = new URLSearchParams(query),
      source = params.get("from") === "ai" ? "ai" : "search";
    show(source);
    root.inert = true;
    root.setAttribute("aria-hidden", "true");
    pages[source].onHide?.();
    chat.open(params.get("q") || "梨形夏季穿搭", source, { autofocus: false });
    overlayEntry = !!history.state?.chat;
  } else {
    show(pages[path] ? path : "home");
    overlayEntry = false;
  }
}
window.addEventListener("popstate", route);
route();
if (!location.hash) history.replaceState({ page: "home" }, "", "#/home");
updateTime();
setInterval(updateTime, 1000);
installViewport((open) => chat.viewportChanged(open));

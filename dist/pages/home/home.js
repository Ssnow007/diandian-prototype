import { statusBar, wireLikes, toast } from "../../shared/ui.js";
import { noteCard } from "../../shared/note-card.js";
import { notes } from "./data.js";
export function createHome(template, { navigate }) {
  const el = document.createElement("section");
  el.className = "page home-page";
  el.innerHTML = statusBar() + template;
  const columns = [...el.querySelectorAll(".masonry-column")];
  let count = 0;
  function append() {
    for (let i = 0; i < 8; i++) {
      const n = notes[count % notes.length];
      columns[count % 2].append(
        noteCard(n, { placeholder: true, id: `home-${count++}` }),
      );
    }
  }
  append();
  el.querySelector(".home-ai-hit").onclick = () => navigate("ai", "right");
  el.querySelector(".home-search-hit").onclick = () =>
    navigate("search", "fade");
  el.querySelector("[data-home]").onclick = () =>
    el.querySelector(".home-feed").scrollTo({ top: 0, behavior: "smooth" });
  el.querySelectorAll("[data-demo]").forEach(
    (b) => (b.onclick = () => toast(`${b.dataset.demo}暂未包含在本次原型中`)),
  );
  wireLikes(el);
  const feed = el.querySelector(".home-feed");
  feed.addEventListener(
    "scroll",
    () => {
      if (feed.scrollHeight - feed.scrollTop - feed.clientHeight < 500)
        append();
    },
    { passive: true },
  );
  return { el };
}

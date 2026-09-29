import { statusBar, image, esc, wireLikes, toast } from "../../shared/ui.js";
import { noteCard } from "../../shared/note-card.js";
import { notes, suggestedQuestions } from "./data.js";
import { ExposureTracker } from "./exposure.js";
export function createSearch(template, { navigate, openChat }) {
  const el = document.createElement("section");
  el.className = "page search-page";
  el.innerHTML = statusBar() + template;
  const feed = el.querySelector(".search-feed"),
    columns = [...el.querySelectorAll(".masonry-column")],
    input = el.querySelector("input");
  let count = 0,
    session = 0,
    inserted = false,
    tab = "全部";
  function questionCard() {
    let c = document.createElement("aside");
    c.className = "ask-card";
    c.setAttribute("aria-label", "试试问点点");
    c.innerHTML = `<h2><span class="mini-mascot" aria-hidden="true"><span class="body"></span><span class="eye"></span><span class="eye"></span></span>试试问点点</h2>${suggestedQuestions.map((q) => `<button class="ask-question" data-question="${esc(q)}">${image("search-imgIcon1.svg")}<span>${q}</span>${image("search-imgGroup98.svg")}</button>`).join("")}`;
    c.querySelectorAll("button").forEach(
      (b) => (b.onclick = () => openChat(b.dataset.question, "search")),
    );
    return c;
  }
  function insertSuggestion() {
    if (inserted) return;
    inserted = true;
    const bottom = feed.getBoundingClientRect().bottom;
    const next = [...columns[1].children].find(
      (c) => c.getBoundingClientRect().top >= bottom,
    );
    columns[1].insertBefore(questionCard(), next || null);
  }
  const tracker = new ExposureTracker(feed, insertSuggestion);
  function append(n = 8) {
    for (let i = 0; i < n; i++) {
      const pool = tab === "视频" ? notes.filter((n) => n.duration) : notes;
      const note = pool[count % pool.length],
        card = noteCard(note, { id: `${session}-${count}` });
      if (note.crop === "blue")
        card.querySelector(".note-cover").innerHTML =
          `<div class="cover-blue-crop">${image(note.cover, "", note.title)}</div>`;
      if (note.duration)
        card
          .querySelector(".note-cover")
          .insertAdjacentHTML(
            "beforeend",
            image("search-img3.svg", "note-video") +
              `<span class="note-duration">${note.duration}</span>`,
          );
      columns[count % 2].append(card);
      count++;
      tracker.observe(card);
    }
  }
  function reset() {
    session++;
    count = 0;
    inserted = false;
    tracker.reset();
    columns.forEach((c) => c.replaceChildren());
    feed.scrollTop = 0;
    append(12);
  }
  append(12);
  feed.addEventListener(
    "scroll",
    () => {
      if (feed.scrollHeight - feed.scrollTop - feed.clientHeight < 800)
        append();
    },
    { passive: true },
  );
  el.querySelector(".search-back").onclick = () => navigate("home", "fade");
  el.querySelector(".search-clear").onclick = () => {
    input.value = "";
    input.focus();
  };
  el.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    if (!input.value.trim()) {
      input.focus();
      return;
    }
    input.blur();
    reset();
  };
  el.querySelector(".search-ask").onclick = () =>
    openChat(input.value.trim(), "search");
  el.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!["全部", "视频", "图片"].includes(b.dataset.tab)) {
          toast(`${b.dataset.tab}分类暂无演示内容`);
          return;
        }
        el.querySelectorAll("[data-tab]").forEach((x) =>
          x.classList.toggle("selected", x === b),
        );
        tab = b.dataset.tab;
        reset();
      }),
  );
  wireLikes(el);
  return {
    el,
    onShow() {
      tracker.setActive(true);
    },
    onHide() {
      tracker.setActive(false);
    },
    setCovered(covered) {
      tracker.setActive(!covered && !el.hidden);
    },
    getExposure() {
      return { count: tracker.seen.size, fired: tracker.fired };
    },
  };
}

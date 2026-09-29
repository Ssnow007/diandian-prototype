import { image, esc } from "./ui.js";
export function noteCard(note, { placeholder = false, id = "" } = {}) {
  const card = document.createElement("article");
  card.className = "note-card";
  card.dataset.noteId = id;
  card.innerHTML = `<div class="note-cover">${placeholder ? "" : image(note.cover, "cover", note.title)}</div><div class="note-info"><p class="note-title">${esc(note.title)}</p><div class="note-meta">${image(note.avatar, "avatar")}<div class="note-author"><span>${esc(note.author)}</span><time>${esc(note.date)}</time></div><button class="note-like" data-likes="${note.likes}" aria-label="赞这条笔记" aria-pressed="false">${image("home-imgIcon.svg")}<span>${note.likes}</span></button></div></div>`;
  return card;
}

export const asset = (file) => `assets/${file}`;
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const image = (file, cls = "", alt = "") =>
  `<img class="${cls}" src="${asset(file)}" alt="${esc(alt)}" draggable="false">`;
export function statusBar() {
  return `<div class="status-bar" aria-label="北京时间与手机状态"><time class="status-time"></time>${image("home-imgCellularConnection.svg", "status-cellular")}${image("home-imgWifi.svg", "status-wifi")}${image("home-imgBorderStroke.svg", "status-battery")}${image("home-imgCap.svg", "status-cap")}<span class="status-capacity"></span></div>`;
}
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
export function updateTime() {
  document.querySelectorAll(".status-time").forEach((t) => {
    t.textContent = formatter.format(new Date());
    t.dateTime = new Date().toISOString();
  });
}
export function toast(message) {
  let el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visible"), 2200);
}
export function wireLikes(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".note-like");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") === "true";
    b.setAttribute("aria-pressed", String(!on));
    b.querySelector("span").textContent =
      Number(b.dataset.likes) + (on ? 0 : 1);
  });
}

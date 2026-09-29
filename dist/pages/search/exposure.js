// Each rendered list item can qualify once per search session. Continuous exposure only.
export class ExposureTracker {
  constructor(root, onThreshold, { threshold = 8, dwell = 300 } = {}) {
    this.root = root;
    this.onThreshold = onThreshold;
    this.threshold = threshold;
    this.dwell = dwell;
    this.seen = new Set();
    this.timers = new Map();
    this.ratios = new Map();
    this.active = false;
    this.fired = false;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          this.ratios.set(e.target, e.intersectionRatio);
          this.update(e.target);
        }
      },
      { root, threshold: [0, 0.5, 1] },
    );
    this.visibility = () => {
      if (document.hidden) this.clearTimers();
      else this.refresh();
    };
    document.addEventListener("visibilitychange", this.visibility);
  }
  observe(el) {
    this.observer.observe(el);
  }
  eligible(el) {
    if (
      !this.active ||
      document.hidden ||
      this.fired ||
      this.seen.has(el.dataset.noteId) ||
      this.ratios.get(el) < 0.5
    )
      return false;
    const a = el.getBoundingClientRect(),
      b = this.root.getBoundingClientRect();
    const area =
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return a.width * a.height > 0 && area / (a.width * a.height) >= 0.5;
  }
  update(el) {
    if (!this.eligible(el)) {
      clearTimeout(this.timers.get(el));
      this.timers.delete(el);
      return;
    }
    if (this.timers.has(el)) return;
    this.timers.set(
      el,
      setTimeout(() => {
        this.timers.delete(el);
        if (!this.eligible(el)) return;
        this.seen.add(el.dataset.noteId);
        this.root.dataset.exposureCount = String(this.seen.size);
        if (this.seen.size >= this.threshold) {
          this.fired = true;
          this.clearTimers();
          this.onThreshold();
        }
      }, this.dwell),
    );
  }
  refresh() {
    for (const el of this.ratios.keys()) this.update(el);
  }
  setActive(active) {
    this.active = active;
    if (!active) this.clearTimers();
    else this.refresh();
  }
  clearTimers() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
  reset() {
    this.clearTimers();
    this.observer.disconnect();
    this.seen.clear();
    this.ratios.clear();
    this.fired = false;
    this.root.dataset.exposureCount = "0";
  }
  destroy() {
    this.reset();
    document.removeEventListener("visibilitychange", this.visibility);
  }
}

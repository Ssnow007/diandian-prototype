import test from "node:test";
import assert from "node:assert/strict";
import { ExposureTracker } from "../dist/pages/search/exposure.js";
let now = 0,
  next = 0;
const jobs = new Map();
globalThis.setTimeout = (fn, delay) => {
  const id = ++next;
  jobs.set(id, { fn, at: now + delay });
  return id;
};
globalThis.clearTimeout = (id) => jobs.delete(id);
const listeners = {};
globalThis.document = {
  hidden: false,
  addEventListener: (n, f) => (listeners[n] = f),
  removeEventListener: (n) => delete listeners[n],
};
globalThis.IntersectionObserver = class {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  disconnect() {}
};
function tick(ms) {
  now += ms;
  for (const [id, j] of [...jobs])
    if (j.at <= now) {
      jobs.delete(id);
      j.fn();
    }
}
const rect = {
  left: 0,
  right: 100,
  top: 0,
  bottom: 100,
  width: 100,
  height: 100,
};
function setup(threshold = 8) {
  jobs.clear();
  now = 0;
  document.hidden = false;
  const root = { dataset: {}, getBoundingClientRect: () => rect };
  let fired = 0;
  const tracker = new ExposureTracker(root, () => fired++, { threshold });
  tracker.setActive(true);
  function card(id, ratio = 1) {
    const c = {
      dataset: { noteId: id },
      getBoundingClientRect: () => ({
        ...rect,
        top: 100 - ratio * 100,
        bottom: 200 - ratio * 100,
      }),
    };
    return c;
  }
  function expose(c, ratio) {
    tracker.observer.cb([{ target: c, intersectionRatio: ratio }]);
  }
  return {
    tracker,
    root,
    card,
    expose,
    get fired() {
      return fired;
    },
  };
}
test("50% and continuous 300ms required; leaving restarts timer", () => {
  const s = setup(),
    c = s.card("a", 0.5);
  s.expose(c, 0.49);
  tick(500);
  assert.equal(s.tracker.seen.size, 0);
  s.expose(c, 0.5);
  tick(299);
  assert.equal(s.tracker.seen.size, 0);
  s.expose(c, 0);
  tick(1);
  assert.equal(s.tracker.seen.size, 0);
  s.expose(c, 0.5);
  tick(300);
  assert.equal(s.tracker.seen.size, 1);
});
test("eighth distinct item fires once; reentry does not duplicate", () => {
  const s = setup();
  for (let i = 0; i < 8; i++) {
    const c = s.card(String(i));
    s.expose(c, 1);
    tick(300);
    s.expose(c, 0);
    s.expose(c, 1);
    tick(300);
    assert.equal(s.tracker.seen.size, i + 1);
    assert.equal(s.fired, i === 7 ? 1 : 0);
  }
  s.expose(s.card("9"), 1);
  tick(300);
  assert.equal(s.fired, 1);
});
test("modal and background pause timers; new search resets count", () => {
  const s = setup(2),
    c = s.card("a");
  s.expose(c, 1);
  tick(200);
  s.tracker.setActive(false);
  tick(500);
  assert.equal(s.tracker.seen.size, 0);
  s.tracker.setActive(true);
  tick(200);
  document.hidden = true;
  listeners.visibilitychange();
  tick(500);
  assert.equal(s.tracker.seen.size, 0);
  document.hidden = false;
  listeners.visibilitychange();
  tick(300);
  assert.equal(s.tracker.seen.size, 1);
  s.tracker.reset();
  assert.equal(s.root.dataset.exposureCount, "0");
  assert.equal(s.tracker.seen.size, 0);
  s.tracker.destroy();
});

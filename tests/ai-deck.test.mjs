import test from "node:test";
import assert from "node:assert/strict";
import { startDeck, DECK_SPEED, LOAD_DURATION } from "../dist/pages/ai/deck.js";
test("AI deck runs three cycles at 1.8× and stops on completion", () => {
  let queued,
    done = 0,
    progress = 0;
  globalThis.requestAnimationFrame = (fn) => {
    queued = fn;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {
    queued = null;
  };
  const cards = Array.from({ length: 3 }, () => ({ style: {} }));
  const start = performance.now();
  const stop = startDeck(
    cards,
    (p) => {
      progress = p;
    },
    () => done++,
  );
  assert.equal(DECK_SPEED, 1.8);
  assert.equal(LOAD_DURATION, (3 * 2900) / 1.8);
  queued(start + 1300);
  assert.ok(progress > 0 && progress < 1);
  assert.ok(cards.some((c) => Number(c.style.opacity) < 1));
  const finalTick = queued;
  queued = null;
  finalTick(start + LOAD_DURATION + 10);
  assert.equal(progress, 1);
  assert.equal(done, 1);
  assert.equal(queued, null);
  stop();
});
test("Leaving the AI page cancels its scheduled deck frame", () => {
  let cancelled = false;
  globalThis.requestAnimationFrame = () => 42;
  globalThis.cancelAnimationFrame = (id) => {
    assert.equal(id, 42);
    cancelled = true;
  };
  startDeck(
    Array.from({ length: 3 }, () => ({ style: {} })),
    () => {},
    () => {},
  )();
  assert.equal(cancelled, true);
});

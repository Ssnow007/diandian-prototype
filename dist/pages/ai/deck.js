export const DECK_SPEED = 1.8;
export const LOAD_DURATION = (3 * 2900) / DECK_SPEED;
export function startDeck(cards, onProgress, onDone, duration = LOAD_DURATION) {
  let raf;
  var order = [0, 1, 2]; /* 从前往后 */

  /* 三个位置（原点 = 卡1底部中心）：
     pos1: 平移0   旋转 0°  缩放1
     pos2: 平移32px 旋转 5° 缩放0.9
     pos3: 平移69px 旋转 10° 缩放0.8
     三张卡旋转后的右边缘依次相隔约 40px */
  var P = [
    { tx: 0, rot: 0, sc: 1 },
    { tx: 32, rot: 5, sc: 0.9 },
    { tx: 69, rot: 10, sc: 0.8 },
  ];
  function css(p) {
    return (
      "translateX(" + p.tx + "px) rotate(" + p.rot + "deg) scale(" + p.sc + ")"
    );
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function lerpP(a, b, t) {
    return {
      tx: lerp(a.tx, b.tx, t),
      rot: lerp(a.rot, b.rot, t),
      sc: lerp(a.sc, b.sc, t),
    };
  }
  /* cubic-bezier 求值（二分反解 x→t） */
  function bez(x1, y1, x2, y2) {
    return function (t) {
      var lo = 0,
        hi = 1,
        m;
      for (var i = 0; i < 14; i++) {
        m = (lo + hi) / 2;
        var xm =
          3 * (1 - m) * (1 - m) * m * x1 + 3 * (1 - m) * m * m * x2 + m * m * m;
        if (xm < t) lo = m;
        else hi = m;
      }
      m = (lo + hi) / 2;
      return (
        3 * (1 - m) * (1 - m) * m * y1 + 3 * (1 - m) * m * m * y2 + m * m * m
      );
    };
  }
  var EASE_MOVE = bez(0.16, 1, 0.3, 1); /* 柔和减速：补位 */
  var EASE_EXIT = bez(0.4, 0, 0.7, 0.2); /* 自然加速：划出 */
  var EASE_FADE = bez(0.2, 0, 0, 1); /* 新卡淡入 */

  var H_BASE = 1900,
    M_BASE = 1000,
    X_BASE = 620,
    F_BASE = 380;
  var CYC_BASE = H_BASE + M_BASE;
  var speed = DECK_SPEED;
  var roundStart = 0;

  function set(id, p, op, z) {
    var el = cards[id];
    el.style.transform = css(p);
    el.style.opacity = op;
    el.style.zIndex = z;
  }

  function tick(now) {
    const elapsedTotal = now - started;
    onProgress(Math.min(elapsedTotal / duration, 1));
    if (elapsedTotal >= duration) {
      onDone();
      return;
    }
    var s = speed;
    var H = H_BASE / s,
      M = M_BASE / s,
      X = X_BASE / s,
      F = F_BASE / s,
      CYC = CYC_BASE / s;
    var t = now - roundStart;
    if (t >= CYC) {
      var skip = Math.floor(t / CYC);
      for (var k = 0; k < skip; k++) {
        order = [order[1], order[2], order[0]];
      }
      roundStart += skip * CYC;
      t = now - roundStart;
    }
    var f = order[0],
      m = order[1],
      b = order[2];

    if (t < H) {
      /* 静止：三卡扇形排布 */
      set(f, P[0], 1, 30);
      set(m, P[1], 1, 29);
      set(b, P[2], 1, 28);
    } else {
      var elapsed = t - H;

      /* 三个动作从同一帧开始：前卡划出，中卡与后卡同时补位。 */
      var em = EASE_MOVE(Math.min(elapsed / M, 1));
      set(m, lerpP(P[1], P[0], em), 1, 30);
      set(b, lerpP(P[2], P[1], em), 1, 29);

      if (elapsed < X) {
        var ex = EASE_EXIT(elapsed / X);
        set(
          f,
          {
            tx: lerp(0, -280, ex),
            rot: lerp(0, -12, ex),
            sc: lerp(1, 0.96, ex),
          },
          1 - ex,
          40,
        );
      } else {
        /* 划出完成后复用为新第三张；淡入与补位的尾段同时结束。 */
        var fade = Math.min((elapsed - X) / F, 1);
        set(f, P[2], EASE_FADE(fade), 28);
      }
    }
    raf = requestAnimationFrame(tick);
  }

  /* 初始布局 */
  set(0, P[0], 1, 30);
  set(1, P[1], 1, 29);
  set(2, P[2], 1, 28);
  roundStart = performance.now();
  const started = roundStart;
  raf = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(raf);
}

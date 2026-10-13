export const nativeKeyboard =
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
export function installViewport(onChange) {
  const phone = document.querySelector("#phone");
  let baseline = window.innerHeight;
  function update() {
    if (!matchMedia("(max-width: 600px), (pointer: coarse) and (max-height: 600px)").matches) {
      phone.style.removeProperty("height");
      phone.style.removeProperty("top");
      onChange(false);
      return;
    }
    const v = window.visualViewport;
    const height = nativeKeyboard
      ? v?.height || window.innerHeight
      : window.innerHeight;
    const editing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (!editing) baseline = window.innerHeight;
    phone.style.height = `${height}px`;
    phone.style.top = `${nativeKeyboard ? v?.offsetTop || 0 : 0}px`;
    onChange(nativeKeyboard && baseline - height > 80);
  }
  window.visualViewport?.addEventListener("resize", update);
  window.visualViewport?.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  document.addEventListener("focusin", update);
  document.addEventListener("focusout", () => setTimeout(update, 100));
  update();
}

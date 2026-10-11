// PROTOTYPE: throwaway floating switcher. Dev-only; never ships.
// Copied from the request-automaton harness, with the data toggle swapped for Open to Work and hero toggles.
export function mountSwitcher(keys: string[], names: Record<string, string>, current: string, onChange: (k: string) => void) {
  const bar = document.createElement("div");
  bar.setAttribute("data-prototype-switcher", "");
  bar.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;gap:8px;align-items:center;" +
    "background:#111;color:#fff;border:2px solid #ff0;border-radius:999px;padding:6px 10px;font:12px/1 ui-monospace,monospace;box-shadow:0 6px 24px #0008;" +
    "max-width:calc(100vw - 16px);flex-wrap:wrap;justify-content:center";
  const btn = (txt: string) => {
    const b = document.createElement("button");
    b.textContent = txt;
    b.style.cssText = "background:#333;color:#fff;border:0;border-radius:999px;padding:6px 10px;cursor:pointer";
    return b;
  };
  const prev = btn("←"), next = btn("→"), otw = btn(""), hero = btn("");
  const label = document.createElement("span");
  label.style.cssText = "min-width:160px;text-align:center";
  let i = Math.max(0, keys.indexOf(current));
  const params = () => new URLSearchParams(location.search);
  const HEROES = ["docked", "live", "off"];
  const render = () => {
    label.textContent = `${keys[i]} · ${names[keys[i]] ?? ""}`;
    otw.textContent = `otw: ${params().get("otw") === "1" ? "on" : "off"}`;
    hero.textContent = `hero: ${params().get("hero") ?? "docked"}`;
  };
  const go = (d: number) => {
    i = (i + d + keys.length) % keys.length;
    const p = params(); p.set("variant", keys[i]);
    history.replaceState(null, "", `?${p}`);
    render(); onChange(keys[i]);
  };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  otw.onclick = () => {
    const p = params(); p.set("otw", p.get("otw") === "1" ? "0" : "1");
    location.search = p.toString();
  };
  hero.onclick = () => {
    const p = params(); p.set("hero", HEROES[(HEROES.indexOf(p.get("hero") ?? "docked") + 1) % HEROES.length]);
    location.search = p.toString();
  };
  addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("input,textarea,[contenteditable]")) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  bar.append(prev, label, next, otw, hero);
  document.body.append(bar);
  render();
}

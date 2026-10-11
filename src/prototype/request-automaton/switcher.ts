// PROTOTYPE: throwaway floating switcher. Dev-only; never ships.
export function mountSwitcher(keys: string[], names: Record<string, string>, current: string, onChange: (k: string) => void) {
  const bar = document.createElement("div");
  bar.setAttribute("data-prototype-switcher", "");
  bar.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;gap:8px;align-items:center;" +
    "background:#111;color:#fff;border:2px solid #ff0;border-radius:999px;padding:6px 10px;font:12px/1 ui-monospace,monospace;box-shadow:0 6px 24px #0008";
  const btn = (txt: string) => {
    const b = document.createElement("button");
    b.textContent = txt;
    b.style.cssText = "background:#333;color:#fff;border:0;border-radius:999px;padding:6px 10px;cursor:pointer";
    return b;
  };
  const prev = btn("←"), next = btn("→"), data = btn("");
  const label = document.createElement("span");
  label.style.cssText = "min-width:200px;text-align:center";
  let i = Math.max(0, keys.indexOf(current));
  const params = () => new URLSearchParams(location.search);
  const render = () => {
    label.textContent = `${keys[i]} · ${names[keys[i]] ?? ""}`;
    data.textContent = `data: ${params().get("data") ?? "sample"}`;
  };
  const go = (d: number) => {
    i = (i + d + keys.length) % keys.length;
    const p = params(); p.set("variant", keys[i]);
    history.replaceState(null, "", `?${p}`);
    render(); onChange(keys[i]);
  };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  data.onclick = () => {
    const p = params(); p.set("data", (p.get("data") ?? "sample") === "sample" ? "live" : "sample");
    location.search = p.toString();
  };
  addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("input,textarea,[contenteditable]")) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  bar.append(prev, label, next, data);
  document.body.append(bar);
  render();
}

// PROTOTYPE: throwaway floating switcher. Dev-only; never ships.
// ← → cycle variants without a reload. The toggle buttons flip a search param and reload.
export interface Toggle {
  param: string;
  /** First value is the default when the param is absent. */
  values: string[];
  label: (value: string) => string;
}

export function mountSwitcher(
  keys: string[],
  names: Record<string, string>,
  current: string,
  onChange: (k: string) => void,
  toggles: Toggle[] = [],
) {
  const bar = document.createElement("div");
  bar.setAttribute("data-prototype-switcher", "");
  bar.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 16px);flex-wrap:wrap;justify-content:center;" +
    "background:#111;color:#fff;border:2px solid #ff0;border-radius:999px;padding:6px 10px;font:12px/1 ui-monospace,monospace;box-shadow:0 6px 24px #0008";
  const btn = (txt: string) => {
    const b = document.createElement("button");
    b.textContent = txt;
    b.style.cssText = "background:#333;color:#fff;border:0;border-radius:999px;padding:6px 10px;cursor:pointer";
    return b;
  };
  const prev = btn("←"), next = btn("→");
  const label = document.createElement("span");
  label.style.cssText = "min-width:180px;text-align:center";
  let i = Math.max(0, keys.indexOf(current));
  const params = () => new URLSearchParams(location.search);
  const valueOf = (t: Toggle) => params().get(t.param) ?? t.values[0];
  const toggleButtons = toggles.map((t) => {
    const b = btn("");
    b.onclick = () => {
      const p = params();
      p.set(t.param, t.values[(t.values.indexOf(valueOf(t)) + 1) % t.values.length]);
      location.search = p.toString();
    };
    return [t, b] as const;
  });
  const render = () => {
    label.textContent = `${keys[i]} · ${names[keys[i]] ?? ""}`;
    for (const [t, b] of toggleButtons) b.textContent = t.label(valueOf(t));
  };
  const go = (d: number) => {
    i = (i + d + keys.length) % keys.length;
    const p = params(); p.set("variant", keys[i]);
    history.replaceState(null, "", `?${p}`);
    render(); onChange(keys[i]);
  };
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("input,textarea,[contenteditable]")) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  bar.append(prev, label, next, ...toggleButtons.map(([, b]) => b));
  document.body.append(bar);
  render();
}

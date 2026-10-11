// PROTOTYPE: throwaway. Variant D's glyph field as G's backdrop, on a viewport-sized sticky canvas.
// No particles, wells or shockwaves: the token and a focused state only warm the glyphs near them.
import { GlyphField, HOT, MONO } from "./glyphs";
import { TONES } from "./flavor";

export interface Clearing { x: number; y: number; w: number; h: number; grow: number; strength: number }

function rgba(hex: string, a: number) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createBackdrop(canvas: HTMLCanvasElement) {
  const g = canvas.getContext("2d");
  const field = new GlyphField();
  let W = 0, H = 0, dpr = 1, dark = false, bg = "#eff1f5";
  let tones: string[] = [];

  function readInk() {
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string, fb: string) => cs.getPropertyValue(`--${k}`).trim() || fb;
    dark = matchMedia("(prefers-color-scheme: dark)").matches;
    bg = v("bg", dark ? "#1e1e2e" : "#eff1f5");
    tones = TONES.map((t) => v(t, "#888"));
    field.setInk(v("faint", "#9ca0b0"), dark ? 0.55 : 0.7);
  }

  function resize(w: number, h: number) {
    if (!g || (w === W && h === H) || !w || !h) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > 5.2e6) dpr = Math.max(1, Math.sqrt(5.2e6 / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    field.resize(W, H, dpr);
    readInk();
  }

  function clearing(c: Clearing) {
    if (!g || !c.w || c.strength <= 0.01) return;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, rgba(bg, 0.94 * c.strength));
    grad.addColorStop(0.7, rgba(bg, 0.86 * c.strength));
    grad.addColorStop(1, rgba(bg, 0));
    g.save();
    g.translate(c.x + c.w / 2, c.y + c.h / 2);
    g.scale((c.w / 2) * c.grow, (c.h / 2) * c.grow);
    g.fillStyle = grad;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  }

  function draw(clearings: Clearing[]) {
    if (!g || !W) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    field.draw(g);
    g.font = `12px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let t = 0; t < tones.length; t++) {
      g.fillStyle = tones[t];
      for (const i of field.hot) {
        if (field.tint[i] !== t) continue;
        const r = (i / field.cols) | 0, y = field.y(r);
        if (y > H + 10) continue;
        g.globalAlpha = Math.min(1, field.heat[i]) * (dark ? 0.75 : 0.85);
        g.fillText(HOT[field.hotChar[i]], field.x(i - r * field.cols), y);
      }
    }
    g.globalAlpha = 1;
    for (const c of clearings) clearing(c);
  }

  return {
    resize,
    readInk,
    draw,
    tick(dt: number) {
      field.scroll(6 * dt);
      field.mutate(2);
      field.cool(dt);
    },
    /** Warms the cell under (x, y), canvas coordinates. */
    warmAt(x: number, y: number, tone: number, heat = 0.9) {
      field.warm(field.at(x, y), heat, tone);
    },
    /** Gently warms a ring of cells around a focused state. */
    warmRing(x: number, y: number, r: number, tone: number) {
      field.near(x, y, r + 46, (i, _cx, _cy, d) => {
        if (d > r + 8) field.warm(i, 0.42 * (1 - (d - r - 8) / 38), tone);
      });
    },
  };
}

export type Backdrop = ReturnType<typeof createBackdrop>;

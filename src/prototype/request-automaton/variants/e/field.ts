// PROTOTYPE: throwaway. Variant E's backdrop: D's glyph field (reused as is), calmer, warmed by the run.
// Heat sources are given in hero-relative coordinates each frame; warm cells draw in the source's tone.
import { GlyphField, HOT, MONO } from "../d/glyphs";
import type { Tone } from "./console";

const TONES: Tone[] = ["sky", "lavender", "mauve", "peach", "green"];

function rgba(hex: string, a: number) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export interface Heat { x: number; y: number; r: number; k: number; tone: Tone }

export interface FieldHandle {
  /** Re-measure the hero; call on resize. */
  resize(): void;
  /** Advance drift and cooling by dt seconds, add heat, draw. */
  step(dt: number, heats: Heat[]): void;
  /** One calm frame for reduced motion: no drift, heat set once. */
  still(heats: Heat[]): void;
  dispose(): void;
}

export function mountField(hero: HTMLElement, canvas: HTMLCanvasElement, clearings: () => HTMLElement[]): FieldHandle {
  const g = canvas.getContext("2d")!;
  const field = new GlyphField();
  let W = 0, H = 0, dpr = 1;
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  let pal = read();

  function read() {
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string) => cs.getPropertyValue(`--${k}`).trim();
    return { bg: v("bg"), faint: v("faint"), dark: scheme.matches, tone: TONES.map(v) };
  }
  function ink() {
    // Calmer than D: a lighter ink, so the copy and the panel own the contrast.
    field.setInk(pal.faint, pal.dark ? 0.42 : 0.5);
  }

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    if (w === W && h === H) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > 5.2e6) dpr = Math.max(1, Math.sqrt(5.2e6 / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    field.resize(W, H, dpr);
    ink();
  }

  function warm(heats: Heat[]) {
    for (const h of heats) {
      const t = TONES.indexOf(h.tone);
      field.near(h.x, h.y, h.r, (i, _x, _y, d) => {
        const a = 1 - d / h.r;
        field.warm(i, h.k * a * a, t);
      });
    }
  }

  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = pal.bg;
    g.fillRect(0, 0, W, H);
    field.draw(g);
    g.font = `12px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const maxA = pal.dark ? 0.85 : 0.95;
    for (let t = 0; t < TONES.length; t++) {
      g.fillStyle = pal.tone[t];
      for (const i of field.hot) {
        if (field.tint[i] !== t) continue;
        const r = (i / field.cols) | 0, y = field.y(r);
        if (y > H + 10) continue;
        g.globalAlpha = Math.min(1, field.heat[i]) * maxA;
        g.fillText(HOT[field.hotChar[i]], field.x(i - r * field.cols), y);
      }
    }
    // A soft clearing behind the copy keeps it readable over the field.
    g.globalAlpha = 1;
    const hb = hero.getBoundingClientRect();
    for (const el of clearings()) {
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      const cx = b.left - hb.left + b.width / 2, cy = b.top - hb.top + b.height / 2;
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, rgba(pal.bg, 0.92));
      grad.addColorStop(0.7, rgba(pal.bg, 0.84));
      grad.addColorStop(1, rgba(pal.bg, 0)); // fade to the bg's own colour, not to transparent black
      g.save();
      g.translate(cx, cy);
      g.scale(b.width * 0.72 + 24, b.height * 0.72 + 24);
      g.fillStyle = grad;
      g.fillRect(-1, -1, 2, 2);
      g.restore();
    }
  }

  const onScheme = () => { pal = read(); ink(); draw(); };
  scheme.addEventListener("change", onScheme);
  resize();

  return {
    resize() { resize(); draw(); },
    step(dt, heats) {
      field.scroll(5 * dt);
      field.mutate(2);
      field.cool(dt);
      warm(heats);
      draw();
    },
    still(heats) {
      field.cool(1); // drop the previous frame's heat entirely
      warm(heats);
      draw();
    },
    dispose() { scheme.removeEventListener("change", onScheme); },
  };
}

// PROTOTYPE: throwaway. A faint, slowly scrolling field of mono glyphs, pre-rendered offscreen.
// Particles, shockwaves and the cursor "warm" cells, which then draw brighter in an accent tone.

export const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const BASE = "··········..··:;-=+~*";
export const HOT = "01<>/\\{}[]*+=#%:;";

export class GlyphField {
  readonly cw = 14;
  readonly ch = 18;
  cols = 0;
  rows = 0;
  /** Height of the wrapping field, at least one row taller than the canvas. */
  span = 0;
  /** Vertical scroll offset in [0, span). */
  drift = 0;
  base = new Uint8Array(0);
  hotChar = new Uint8Array(0);
  heat = new Float32Array(0);
  tint = new Uint8Array(0);
  private flag = new Uint8Array(0);
  hot: number[] = [];
  readonly canvas = document.createElement("canvas");
  private g = this.canvas.getContext("2d");
  private dpr = 1;
  private color = "#888";
  private alpha = 0.3;

  resize(w: number, h: number, dpr: number) {
    this.dpr = dpr;
    this.cols = Math.ceil(w / this.cw) + 1;
    this.rows = Math.ceil(h / this.ch) + 2;
    this.span = this.rows * this.ch;
    const size = this.cols * this.rows;
    this.base = new Uint8Array(size);
    this.hotChar = new Uint8Array(size);
    this.heat = new Float32Array(size);
    this.tint = new Uint8Array(size);
    this.flag = new Uint8Array(size);
    this.hot = [];
    for (let i = 0; i < size; i++) {
      this.base[i] = (Math.random() * BASE.length) | 0;
      this.hotChar[i] = (Math.random() * HOT.length) | 0;
    }
    this.canvas.width = Math.ceil(this.cols * this.cw * dpr);
    this.canvas.height = Math.ceil(this.span * dpr);
    this.paint();
  }

  setInk(color: string, alpha: number) {
    this.color = color;
    this.alpha = alpha;
    this.paint();
  }

  private prep() {
    const g = this.g!;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.font = `12px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = this.color;
    g.globalAlpha = this.alpha;
    return g;
  }

  private paint() {
    if (!this.g || !this.cols) return;
    const g = this.prep();
    g.clearRect(0, 0, this.cols * this.cw, this.span);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        g.fillText(BASE[this.base[r * this.cols + c]], c * this.cw + this.cw / 2, r * this.ch + this.ch / 2);
  }

  /** Flips a few random glyphs so the field never sits perfectly still. */
  mutate(k: number) {
    if (!this.g || !this.cols) return;
    const g = this.prep();
    for (let n = 0; n < k; n++) {
      const i = (Math.random() * this.base.length) | 0;
      const r = (i / this.cols) | 0, c = i % this.cols;
      this.base[i] = (Math.random() * BASE.length) | 0;
      g.clearRect(c * this.cw, r * this.ch, this.cw, this.ch);
      g.fillText(BASE[this.base[i]], c * this.cw + this.cw / 2, r * this.ch + this.ch / 2);
    }
  }

  scroll(px: number) {
    if (!this.span) return;
    this.drift = (((this.drift - px) % this.span) + this.span) % this.span;
  }

  x(c: number) {
    return c * this.cw + this.cw / 2;
  }

  y(r: number) {
    const y = r * this.ch + this.ch / 2 + this.drift;
    return y >= this.span ? y - this.span : y;
  }

  at(x: number, y: number) {
    const c = Math.floor(x / this.cw);
    if (c < 0 || c >= this.cols || !this.span) return -1;
    const yy = (((y - this.drift) % this.span) + this.span) % this.span;
    return Math.floor(yy / this.ch) * this.cols + c;
  }

  warm(i: number, amount: number, tint: number) {
    if (i < 0) return;
    if (this.heat[i] < amount) {
      this.heat[i] = amount;
      this.tint[i] = tint;
    }
    if (!this.flag[i]) {
      this.flag[i] = 1;
      this.hot.push(i);
    }
  }

  cool(dt: number) {
    const k = dt * 1.4;
    let w = 0;
    for (let n = 0; n < this.hot.length; n++) {
      const i = this.hot[n];
      this.heat[i] -= k;
      if (this.heat[i] > 0) this.hot[w++] = i;
      else {
        this.heat[i] = 0;
        this.flag[i] = 0;
      }
    }
    this.hot.length = w;
  }

  /** Calls `fn` for every cell whose centre lies within `R` of (x, y), with its screen centre and distance. */
  near(x: number, y: number, R: number, fn: (i: number, cx: number, cy: number, d: number) => void) {
    if (!this.span) return;
    const c0 = Math.max(0, Math.floor((x - R) / this.cw)), c1 = Math.min(this.cols - 1, Math.floor((x + R) / this.cw));
    const top = y - R;
    const r0 = Math.floor(((((top - this.drift) % this.span) + this.span) % this.span) / this.ch);
    let y0 = r0 * this.ch + this.ch / 2 + this.drift;
    while (y0 > top + this.ch) y0 -= this.span;
    while (y0 < top - this.ch) y0 += this.span;
    const count = Math.ceil((2 * R) / this.ch) + 2;
    for (let k = 0; k < count; k++) {
      const r = (r0 + k) % this.rows, cy = y0 + k * this.ch;
      for (let c = c0; c <= c1; c++) {
        const cx = c * this.cw + this.cw / 2;
        const d = Math.hypot(cx - x, cy - y);
        if (d <= R) fn(r * this.cols + c, cx, cy, d);
      }
    }
  }

  draw(g: CanvasRenderingContext2D) {
    if (!this.span) return;
    const w = this.cols * this.cw;
    g.drawImage(this.canvas, 0, this.drift, w, this.span);
    if (this.drift > 0) g.drawImage(this.canvas, 0, this.drift - this.span, w, this.span);
  }
}

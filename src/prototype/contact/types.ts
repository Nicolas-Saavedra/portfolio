// PROTOTYPE: throwaway. The contract every contact variant implements.
import type { CONTACT } from "./content";

export interface VariantContext {
  contact: typeof CONTACT;
  /** Open to Work (`?otw=1`). Contact may acknowledge it in one line at most, and never repeats the CV button. */
  openToWork: boolean;
  /** The build date as "YYYY-MM-DD", computed in the route's frontmatter (at build time on the real site). */
  builtAt: string;
  reducedMotion: boolean;
}

export interface Variant {
  /** Short human label shown in the switcher. */
  name: string;
  /**
   * Render the contact section (and anything after it, such as a colophon) into `root`, an empty <div> below the work
   * section. Static markup only: no listeners, observers or timers (ADR 0002). Return a cleanup function.
   */
  mount(root: HTMLElement, ctx: VariantContext): () => void;
}

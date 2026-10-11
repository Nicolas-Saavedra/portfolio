// PROTOTYPE: throwaway. The contract every Selected Work variant implements.
import type { CaseStudy } from "./content";

export interface VariantContext {
  /** The four Case Studies, already sorted by `order`. */
  work: CaseStudy[];
  reducedMotion: boolean;
  /** Open to Work is on: the Timeline and the CV link sit between the hero and this section. */
  openToWork: boolean;
}

export interface Variant {
  /** Short human label shown in the switcher, e.g. "Typographic index". */
  name: string;
  /**
   * Render the whole Selected Work section into `root` (an empty <div> between the hero and the next
   * section). Render your own <section> with a visible heading. Return a cleanup function that removes
   * everything you added and every listener, observer and frame you started.
   */
  mount(root: HTMLElement, ctx: VariantContext): () => void;
}

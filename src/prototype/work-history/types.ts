// PROTOTYPE: throwaway. The contract every Selected Work × Timeline fusion variant implements.
import type { CASE_STUDIES, CV, EDUCATION, NOW, OPEN_TO_WORK, ROLES, TRACKS } from "./content";

export interface VariantContext {
  /** Every Role, newest first within each Track (D calls these `entries`). */
  entries: typeof ROLES;
  /** The four Case Studies, sorted by `order` (H calls these `work`). Join to roles with `content.ts` helpers. */
  work: typeof CASE_STUDIES;
  education: typeof EDUCATION;
  tracks: typeof TRACKS;
  cv: typeof CV;
  now: typeof NOW;
  /** Open to Work (`?otw=1`). The section is the same slot either way: the variant changes its own emphasis. */
  openToWork: boolean;
  openToWorkCopy: typeof OPEN_TO_WORK;
  reducedMotion: boolean;
}

export interface Variant {
  /** Short human label shown in the switcher, e.g. "Graph with inline depth". */
  name: string;
  /**
   * Render the whole fused section (one <section> with a visible <h2>, every Role, Education, every Case Study's way
   * in and its /work/<slug> link, the CV link) into `root`, an empty <div> between the hero and the contact stub.
   * Return a cleanup function that removes everything you added and every listener, observer and frame you started.
   */
  mount(root: HTMLElement, ctx: VariantContext): () => void;
}

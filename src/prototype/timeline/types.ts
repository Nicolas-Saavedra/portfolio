// PROTOTYPE: throwaway. The contract every Timeline variant implements.
import type { CV, EDUCATION, ENTRIES, NOW, TRACKS } from "./data";

export interface VariantContext {
  entries: typeof ENTRIES;
  education: typeof EDUCATION;
  tracks: typeof TRACKS;
  cv: typeof CV;
  now: typeof NOW;
  /** Open to Work (`?otw=1`). The harness has already moved the slot above Selected Work; the variant shows the "open to roles" signal. */
  openToWork: boolean;
  reducedMotion: boolean;
}

export interface Variant {
  /** Short human label shown in the switcher, e.g. "Two lanes". */
  name: string;
  /** Render the whole Timeline section (heading, Tracks, Education, CV link) into `root`. Return a cleanup function. */
  mount(root: HTMLElement, ctx: VariantContext): () => void;
}

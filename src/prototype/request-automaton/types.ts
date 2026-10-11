// PROTOTYPE: throwaway. The contract every variant implements.
import type { Run } from "./model";

export const COPY = {
  name: "Nicolas Saavedra",
  headline: "Founding Engineer at Blinka (YC F26)",
  intro:
    "I run everything Blinka puts in production: the AWS stack, the CI/CD that ships it, and the observability that tells us when it breaks. I also review every PR that goes in, and teach frontend at Universidad de los Andes on the side.",
  pillars: ["Infrastructure & AWS", "Observability", "Building and reviewing product code"],
};

export interface VariantContext {
  run: Run;
  copy: typeof COPY;
  reducedMotion: boolean;
}

export interface Variant {
  /** Short human label shown in the switcher, e.g. "Plain line". */
  name: string;
  /** Render the whole hero (copy + Request Automaton) into `root`. Return a cleanup function. */
  mount(root: HTMLElement, ctx: VariantContext): () => void;
}

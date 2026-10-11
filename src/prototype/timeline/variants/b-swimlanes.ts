// PROTOTYPE: throwaway. Variant B, "Swimlanes": the Tracks as parallel lanes on a proportional, month-accurate time
// axis from 2020 to now, Education as its own band, a "now" marker. Phones get the same chart turned vertical
// (time running down from now, Tracks as columns). Detail reveals into a reserved cell below the chart.
// No runtime JS beyond inserting the markup: selection is radio inputs + :has(), layout switches with a container
// query, and the unrolling reveal is a scroll-driven animation. `render()` is pure, so it could run at build time.
import type { Variant } from "../types";
import { render } from "./b/render";

const variant: Variant = {
  name: "Swimlanes",
  mount(root, ctx) {
    const section = document.createElement("section");
    section.setAttribute("aria-labelledby", "tlb-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
    section.innerHTML = render(ctx);
    root.append(section);
    return () => section.remove();
  },
};

export default variant;

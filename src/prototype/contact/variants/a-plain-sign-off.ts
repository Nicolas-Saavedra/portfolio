// PROTOTYPE: throwaway. Contact A, "Plain sign-off": one sentence, the address set large, two small links.
// The one idea: this is where the eye rests. Nothing else.
import { SIGNOFF_STYLE, signOff } from "../signoff";
import type { Variant } from "../types";

const STYLE = `
#ct-a .ct-body{padding-top:clamp(3.5rem,2.5rem + 4vw,6rem);padding-bottom:clamp(5rem,4rem + 5vw,8rem)}
`;

const variant: Variant = {
  name: "Plain sign-off",
  mount(root, ctx) {
    const section = document.createElement("section");
    section.id = "ct-a";
    section.className = "ct mx-auto w-full max-w-6xl px-4 sm:px-8";
    section.setAttribute("aria-labelledby", "ct-a-title");
    section.innerHTML = `<style>${SIGNOFF_STYLE}${STYLE}</style>
      <div class="ct-rule ct-body">${signOff(ctx, "ct-a-title")}</div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;

// PROTOTYPE: placeholder, to be replaced by the variant agent.
import type { Variant } from "../types";
const variant: Variant = {
  name: "b-textbook (placeholder)",
  mount(root, { run }) {
    root.innerHTML = `<pre class="p-8 font-mono text-sm">${JSON.stringify(run, null, 2)}</pre>`;
    return () => {};
  },
};
export default variant;

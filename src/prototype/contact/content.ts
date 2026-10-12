// PROTOTYPE: throwaway. The contact section's content, shared by every variant. On the real site this comes from the
// site config (contact: email, GitHub, LinkedIn) and the Open to Work flag; the copy is a draft for Nicolas to edit.

export const CONTACT = {
  email: "personal@nicolassaavedra.com",
  links: [
    { label: "GitHub", href: "https://github.com/Nicolas-Saavedra" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nsaavedrag/" },
  ],
  /** The sign-off: one first-person sentence. The words in `cta` become the mailto link. */
  signOff: { before: "If any of this is close to what you're working on, ", cta: "write to me", after: "." },
  /** Open to Work swaps the sentence, and that's all contact does about it (the CV button lives in the work section). */
  signOffOpenToWork: { before: "I'm open to new roles, so if any of this fits what you're hiring for, ", cta: "write to me", after: "." },
  /** B's colophon. */
  colophon: {
    sentence:
      "I built this site with Astro and serve it from Cloudflare. I wrote it with coding agents and reviewed every change myself. My career data lives in files the build checks, so this page and my CV say the same thing.",
    repo: { label: "Nicolas-Saavedra/portfolio", href: "https://github.com/Nicolas-Saavedra/portfolio" },
    stack: "Astro · Cloudflare",
    license: "code MIT, content all rights reserved",
  },
};

/** "2026-10-11" → "11 Oct 2026". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${d} ${month} ${y}`;
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

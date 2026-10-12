// PROTOTYPE: throwaway. The fused content for the Selected Work × Timeline section, shared by every variant so they
// differ in design, not in facts. Reconciled from `selected-work/content.ts` (H's Case Studies, verbatim) and
// `timeline/data.ts` (D's roles, verbatim), so H's and D's helper code can be copied over with little change.
// Facts come from the LinkedIn export and the spec (issue #1); the thesis dates come from mercury-lib's commit history,
// and its title, advisor, link and scope (deterministic automata and transducers, replacing GOLD-3) from its record in the
// Uniandes repository.
// Copy is a first draft for Nicolas to edit: English, first person, hard counts only, no percentages, no certifications.
//
// The join: a Role may point at one Case Study (`caseStudy`, a slug), and a Case Study lists its `spans` in time order.
// A span either is a Role (`role` set) or is not a role at all (the mercury-lib thesis, which happened inside the degree).
//   - Blinka, NoEstasSolx: one span, one role (1:1).
//   - GOLD → mercury: the research-assistant role, then the thesis. The story outlives the role.
//   - Teaching: the tutor role, then the instructor role. One Case Study spans the whole Teaching Track.
//   - Portafolio has no Case Study. Education sits beside the Tracks and has none either: it isn't a Case Study, but it
//     carries a readout of its own (`story`), and its counts are derived from the roles and spans inside it
//     (`educationFacts`), never typed in.
// - A Case Study page on this site is optional (`page`). Without one, the home page's readout is the whole Case Study.

export type TrackId = "engineering" | "teaching";

/** "YYYY-MM". */
export type YearMonth = `${number}-${string}`;

// ── Organizations ─────────────────────────────────────────────────────────────────────────────────────────────

/** Short names for tight spaces (the rail's line 2), keyed by the full name. Readouts and screen readers keep the full name. */
export const ORGANIZATION_SHORT: Record<string, string> = {
  "Universidad de los Andes": "Uniandes",
};
/** An organization's short name, or its full name if it has none. */
export const orgShort = (name: string): string => ORGANIZATION_SHORT[name] ?? name;

/** The mercury-lib thesis's record in the Uniandes repository (Case Study links and the degree's readout share it). */
const THESIS_HREF = "https://hdl.handle.net/1992/77403";

// ── Timeline: Tracks, Roles, Education ─────────────────────────────────────────────────────────────────────────

export const TRACKS: { id: TrackId; label: string; blurb: string }[] = [
  { id: "engineering", label: "Engineering", blurb: "Building production software" },
  { id: "teaching", label: "Teaching", blurb: "Instructing and tutoring" },
];

export interface Role {
  id: string;
  track: TrackId;
  organization: string;
  /** The team, unit or product inside the organization, so the Uniandes roles don't blur together. */
  context?: string;
  title: string;
  start: YearMonth;
  end: YearMonth | "present";
  location: string;
  /** One line, first person. */
  summary: string;
  /** A short list, hard counts only. */
  highlights: string[];
  /** Slug of the Case Study this role is part of, if any. */
  caseStudy?: string;
  /** Copy pending clearance (Blinka). Show it's a draft somewhere unobtrusive. */
  draft?: boolean;
}

/** Newest first within each Track. `ENTRIES` is the name D's code uses. */
export const ROLES: Role[] = [
  {
    id: "blinka",
    track: "engineering",
    organization: "Blinka (YC F26)",
    title: "Founding Engineer",
    start: "2026-01",
    end: "present",
    location: "Bogotá, Colombia",
    summary: "I started Blinka's codebase and run everything it puts in production, as its only infrastructure engineer.",
    highlights: [
      "Set the original architecture: domain-driven design with feature slices across frontend and backend",
      "Own the AWS stack end to end: Lambda, RDS, API Gateway, CloudFront, CloudWatch",
      "Built and maintain the CI/CD pipeline on GitHub Actions, and the platform's monitoring, logs and alerts",
      "Review and approve every PR the team ships",
    ],
    caseStudy: "blinka",
    draft: true,
  },
  {
    id: "noestassolx",
    track: "engineering",
    organization: "Universidad de los Andes",
    context: "NoEstasSolx",
    title: "Full Stack Developer",
    start: "2025-01",
    end: "2025-06",
    location: "Bogotá, Colombia",
    summary: "I built NoEstasSolx with a team of 6: the platform first-semester students use to find academic and wellbeing support.",
    highlights: [
      "Adopted by 1,000+ first-semester students",
      "Real-time access to 20+ university services, built with React and FastAPI",
      "Internal tools for staff on FastAPI, Docker, NGINX and Traefik, deployed through GitHub Actions",
    ],
    caseStudy: "noestassolx",
  },
  {
    id: "portafolio",
    track: "engineering",
    organization: "Universidad de los Andes",
    context: "Portafolio",
    title: "Full Stack Developer",
    start: "2024-08",
    end: "2024-12",
    location: "Bogotá, Colombia",
    summary: "I worked on Portafolio, the internal tool department heads use to review teaching-performance reports.",
    highlights: [
      "Used by 50+ department heads and administrators across 100+ reports",
      "Designed custom JWT authentication and access control aligned with the OWASP guidelines",
      "Fixed query bottlenecks for 2× faster report generation",
      "Shipped 6+ features in AngularJS and Spring Boot, including batch review views",
    ],
  },
  {
    id: "research",
    track: "engineering",
    organization: "Universidad de los Andes",
    context: "GOLD-python",
    title: "Research Assistant",
    start: "2022-08",
    end: "2022-12",
    location: "Bogotá, Colombia",
    summary: "I wrote GOLD-python, an open-source library for building and simulating DFAs, NFAs and ε-NFAs.",
    highlights: [
      "Used by 200+ students in the Lenguajes y Máquinas course",
      "Simulation, union and conversion between automaton representations, built on graph traversal",
    ],
    caseStudy: "gold-to-mercury",
  },
  {
    id: "instructor",
    track: "teaching",
    organization: "Universidad de los Andes",
    context: "Continuing Education",
    title: "Instructor",
    start: "2025-08",
    end: "present",
    location: "Bogotá, Colombia",
    summary: "I teach the university's continuing-education frontend course, from HTML and CSS to React.",
    highlights: ["150+ students taught", "From Flexbox and Grid to Git, Tailwind and React Query"],
    caseStudy: "teaching",
  },
  {
    id: "tutor",
    track: "teaching",
    organization: "Universidad de los Andes",
    context: "Programming tutoring",
    title: "Programming Tutor",
    start: "2023-08",
    end: "2024-05",
    location: "Bogotá, Colombia",
    summary: "I tutored students one to one through data structures, algorithms and Python's data tools.",
    highlights: ["40+ students per semester", "Linked lists, trees and graphs, recursion and memory, pandas and NumPy"],
    caseStudy: "teaching",
  },
];
export const ENTRIES = ROLES;

export interface Education {
  institution: string;
  /** The full name, from the LinkedIn export. */
  degree: string;
  /** The degree's two halves, for tight spaces: the rail prints `field` as its title and `level` as its context. */
  level: string;
  field: string;
  start: YearMonth;
  end: YearMonth;
  location: string;
  /**
   * The readout's story, first person: the degree's version of a Case Study's problem → what I did → outcome. Between
   * the two, the readout lists what the degree held, derived (`insideDegree`), not written here. Counts never go in this
   * copy; they're derived (`educationFacts`).
   */
  story: { degree: string; after: string };
  /** Hard counts only Nicolas can supply (a distinction, say), shown after the derived ones. None for now. */
  facts?: Fact[];
  /**
   * The thesis's record, from the Uniandes repository (`dc.*` fields). `title` is an English rendering for the
   * English-only site; `original` is the exact Spanish title. The repository's issue date (2025-11-04) is the
   * publication date; the work itself is the Feb – May 2025 span on the GOLD → mercury Case Study (commit history).
   */
  thesis?: { title: string; original: string; advisor: string; href: string; label: string };
}

export const EDUCATION: Education = {
  institution: "Universidad de los Andes",
  degree: "Bachelor's in Systems and Computing Engineering",
  level: "Bachelor's",
  field: "Systems and Computing Engineering",
  start: "2020-01",
  end: "2026-03",
  location: "Bogotá, Colombia",
  story: {
    degree: "My engineering degree. Both Tracks on this page began here, as jobs I took at the university while I studied.",
    after: "I finished it while already at Blinka. Both Tracks carry on past it.",
  },
  thesis: {
    title: "Mercury: a library for building deterministic automata in education",
    original: "Mercury: Librería para el desarrollo de autómatas determinísticos en ambientes educativos",
    advisor: "Silvia Takahashi Rodríguez",
    href: THESIS_HREF,
    label: "Uniandes record (Spanish)",
  },
};

// ── Selected Work: Case Studies ────────────────────────────────────────────────────────────────────────────────

export interface Period {
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or "present" */
  end: string;
  /** Ready-made display string, e.g. "Jan 2026 – now". */
  label: string;
}

/** A hard count Nicolas can defend, e.g. { value: "1,000+", label: "first-semester students" }. */
export interface Fact {
  value: string;
  label: string;
}

/** One stretch of a Case Study's story. With `role`, it is that Role's dates; without, it isn't a role (the thesis). */
export interface Span {
  /** Short display label, e.g. "GOLD-python, research assistant". */
  label: string;
  start: YearMonth;
  end: YearMonth | "present";
  /** Id of the Role this span is, if it is one. */
  role?: string;
}

export interface CaseStudy {
  slug: string;
  /** Display order in Selected Work, 1 first. */
  order: number;
  title: string;
  /** Short name for tight spaces (tabs, state labels, mono metadata). */
  short: string;
  org: string;
  role: string;
  /** The whole story's period, first span start to last span end. */
  period: Period;
  /** The story's stretches in time order; see the header comment. */
  spans: Span[];
  /** One-line summary for the home page. */
  summary: string;
  /** Problem → what I did → outcome. With no page (`page`), this is the whole Case Study, so it can't read as a teaser. */
  problem: string;
  did: string;
  outcome: string;
  technologies: string[];
  /** Hard counts. No number is printed twice in one view, so counts live here and not in the trace copy. */
  facts: Fact[];
  /** Where the Case Study page would live on this site. Only linked when `page` is true. */
  href: string;
  /**
   * Whether the Case Study has a page of its own at `href`. Off by default: the home page's readout is then the complete
   * Case Study, and nothing links to `href`. Turn it on per Case Study once its page exists.
   */
  page?: boolean;
  /** Outside links (repos, live sites), possibly none. */
  links: { label: string; href: string }[];
  /** Copy not cleared for publishing yet. Show a visible "draft" mark. */
  draft?: { reason: string };
}

/** Sorted by `order`. `WORK` is the name H's code uses (as `ctx.work`). */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "blinka",
    order: 1,
    title: "Running Blinka's infrastructure",
    short: "Blinka",
    org: "Blinka (YC F26)",
    role: "Founding Engineer, the only infrastructure engineer",
    period: { start: "2026-01", end: "present", label: "Jan 2026 – now" },
    spans: [{ label: "Founding Engineer", start: "2026-01", end: "present", role: "blinka" }],
    summary: "I started Blinka's codebase and run everything it puts in production, from the AWS stack to the alerts.",
    problem:
      "Blinka is a YC fintech building USD accounts for global companies. Money moves through it, so production has to be trustworthy from day one, and one engineer owns all of it.",
    did: "I set the initial architecture (domain-driven design, with feature slices across frontend and backend), built the AWS stack and the GitHub Actions pipeline that ships it, own observability, and review every PR the team opens.",
    outcome:
      "Everything Blinka runs ships through one pipeline and one set of dashboards, and the technical groundwork for its new banking division is in place.",
    technologies: ["AWS Lambda", "RDS", "API Gateway", "CloudFront", "CloudWatch", "GitHub Actions", "TypeScript"],
    facts: [
      { value: "300+", label: "PRs I've reviewed" },
      { value: "300+", label: "PRs of mine merged" },
    ],
    href: "/work/blinka",
    links: [],
    draft: { reason: "pending clearance by Blinka's cofounders" },
  },
  {
    slug: "gold-to-mercury",
    order: 2,
    title: "From GOLD-python to mercury-lib",
    short: "GOLD → mercury",
    org: "Universidad de los Andes",
    role: "Research assistant, then thesis author",
    period: { start: "2022-08", end: "2025-05", label: "2022 – 2025" },
    spans: [
      { label: "GOLD-python, research assistant", start: "2022-08", end: "2022-12", role: "research" },
      { label: "mercury-lib, thesis", start: "2025-02", end: "2025-05" },
    ],
    summary: "An automata library I wrote for 200+ students as a research assistant, rebuilt years later as my thesis library.",
    problem:
      "Lenguajes y Máquinas taught automata with GOLD-3: a tool on obsolete Java, with its own editor and docs that were hard to find.",
    did: "As a research assistant I wrote GOLD-python, an open-source library for simulating DFAs, NFAs and ε-NFAs, with union and conversion. My thesis rebuilt it as mercury-lib, GOLD-3's replacement: DFAs and deterministic transducers, with Sphinx docs and a d3 visualizer.",
    outcome:
      "Students in the course built and ran their own automata with GOLD-python. mercury-lib's renderer is the ancestor of the automaton at the top of this page.",
    technologies: ["Python", "Graph traversal", "d3"],
    facts: [{ value: "200+", label: "students in Lenguajes y Máquinas" }],
    href: "/work/gold-to-mercury",
    links: [
      { label: "GOLD-python on GitHub", href: "https://github.com/GOLD-Python/GOLD-Python" },
      { label: "mercury-lib on GitHub", href: "https://github.com/Nicolas-Saavedra/mercury-lib" },
      { label: "Thesis at Uniandes", href: THESIS_HREF },
    ],
  },
  {
    slug: "noestassolx",
    order: 3,
    title: "NoEstasSolx",
    short: "NoEstasSolx",
    org: "Universidad de los Andes",
    role: "Full Stack Developer, team of 6",
    period: { start: "2025-01", end: "2025-06", label: "Jan – Jun 2025" },
    spans: [{ label: "Full Stack Developer", start: "2025-01", end: "2025-06", role: "noestassolx" }],
    summary: "A platform 1,000+ first-semester students used to reach academic and wellbeing services, plus the tools staff ran it with.",
    problem:
      "First-semester students had their institutional services spread across offices and websites, and the staff running their induction did much of it by hand.",
    did: "In a team of 6, I built the features that give students real-time access to those services in one place, in React and FastAPI, built internal tools and messaging for staff on FastAPI, Docker, NGINX and Traefik, and automated deploys with GitHub Actions.",
    outcome: "First-semester students adopted it to reach their academic and wellbeing services, and releases went out through a pipeline instead of by hand.",
    technologies: ["React", "FastAPI", "Docker", "NGINX", "Traefik", "GitHub Actions"],
    facts: [
      { value: "1,000+", label: "first-semester students" },
      { value: "20+", label: "institutional services in one place" },
    ],
    href: "/work/noestassolx",
    links: [],
  },
  {
    slug: "teaching",
    order: 4,
    title: "Teaching frontend, from HTML to React",
    short: "Teaching",
    org: "Universidad de los Andes",
    role: "Instructor, Continuing Education; before that, programming tutor",
    period: { start: "2023-08", end: "present", label: "2023 – now" },
    spans: [
      { label: "Programming tutor", start: "2023-08", end: "2024-05", role: "tutor" },
      { label: "Instructor, Continuing Education", start: "2025-08", end: "present", role: "instructor" },
    ],
    summary: "I've taken 150+ people from their first HTML tag to React, after tutoring 40+ students a semester.",
    problem: "People joining the Continuing Education frontend course need to go from no web background to building a React app in one course.",
    did: "I teach the course end to end: HTML, CSS layout with Flexbox and Grid, Git, Tailwind, React and React Query. Before that I tutored programming one on one: data structures, recursion, memory, pandas and NumPy.",
    outcome: "I've taught the course since August 2025, taking each cohort from a blank page to a React app.",
    technologies: ["HTML", "CSS", "Git", "Tailwind", "React", "React Query"],
    facts: [
      { value: "150+", label: "students taught, HTML to React" },
      { value: "40+", label: "students tutored each semester" },
    ],
    href: "/work/teaching",
    links: [],
  },
];
export const WORK = CASE_STUDIES;

// ── Open to Work, CV, now ──────────────────────────────────────────────────────────────────────────────────────

/** The CV link. A placeholder: the real one is generated at build time (spec, "CV generation"). */
export const CV = { href: "/cv.pdf", label: "Download CV (PDF)" };

/** Open to Work copy (D's "next" row wording). Shown only with `?otw=1`. */
export const OPEN_TO_WORK = {
  signal: "open to roles",
  sentence: "I'm open to new roles.",
  aside: "The whole record is below, and in my CV.",
};

/** "Now", as "YYYY-MM". The real site fixes this at build time. */
export const NOW: YearMonth = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` as YearMonth;
})();

// ── Helpers ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Months since year 0, for arithmetic. `"present"` resolves to NOW. */
export function monthIndex(ym: YearMonth | "present" | string): number {
  const [y, m] = (ym === "present" ? NOW : ym).split("-").map(Number);
  return y * 12 + (m - 1);
}

export const roleById = (id: string): Role | undefined => ROLES.find((r) => r.id === id);
export const caseStudyBySlug = (slug: string): CaseStudy | undefined => CASE_STUDIES.find((c) => c.slug === slug);
/** The Case Study a role belongs to, if any. */
export const caseStudyOf = (role: Role): CaseStudy | undefined => (role.caseStudy ? caseStudyBySlug(role.caseStudy) : undefined);
/** The roles a Case Study spans, oldest first (not its non-role spans). */
export const rolesOf = (cs: CaseStudy): Role[] => cs.spans.flatMap((s) => (s.role ? [roleById(s.role)!] : []));

/**
 * What the degree held, oldest first: every role at the degree's institution that began during it, and every Case Study
 * span that isn't a role and began during it (the thesis). Blinka overlaps the degree's last months but isn't at the
 * university, so it isn't held.
 */
export function insideDegree(edu: Education = EDUCATION) {
  const during = (ym: string) => monthIndex(ym) >= monthIndex(edu.start) && monthIndex(ym) <= monthIndex(edu.end);
  const roles = ROLES.filter((r) => r.organization === edu.institution && during(r.start));
  const spans = CASE_STUDIES.flatMap((cs) => cs.spans.filter((s) => !s.role && during(s.start)).map((span) => ({ cs, span })));
  return { roles, spans };
}

/** The degree's facts: counts derived from the data (never typed in), then any Nicolas adds by hand (`facts`). */
export function educationFacts(edu: Education = EDUCATION): Fact[] {
  const { roles } = insideDegree(edu);
  return [{ value: String(roles.length), label: "roles at the university, begun while I studied" }, ...(edu.facts ?? [])];
}

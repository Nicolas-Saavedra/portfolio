// PROTOTYPE: throwaway. The four Case Studies as typed data, shared by every variant so they differ in design, not facts.
// Facts come from Nicolas's LinkedIn export and the spec (issue #1). All copy is a first draft for Nicolas to edit:
// English, first person, hard counts only, no percentages, no certifications.

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

export interface CaseStudy {
  slug: string;
  /** Display order on the home page, 1 first. */
  order: number;
  title: string;
  /** Short name for tight spaces (tabs, state labels, mono metadata). */
  short: string;
  org: string;
  role: string;
  period: Period;
  /** One-line summary for the home page. */
  summary: string;
  /** The Case Study page tells problem → what he did → outcome; a variant may tease it. */
  problem: string;
  did: string;
  outcome: string;
  technologies: string[];
  facts: Fact[];
  /** The Case Study page on this site. */
  href: string;
  /** An optional outside link (repo, live site). */
  external?: { label: string; href: string };
  /** Copy not cleared for publishing yet. Show a visible "draft" mark. */
  draft?: { reason: string };
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "blinka",
    order: 1,
    title: "Running Blinka's infrastructure",
    short: "Blinka",
    org: "Blinka (YC F26)",
    role: "Founding Engineer, the only infrastructure engineer",
    period: { start: "2026-01", end: "present", label: "Jan 2026 – now" },
    summary: "I started Blinka's codebase and run everything it puts in production, from the AWS stack to the alerts.",
    problem:
      "Blinka is a YC fintech building USD accounts for global companies. Money moves through it, so production has to be trustworthy from day one, and one engineer owns all of it.",
    did: "I set the initial architecture (domain-driven design, with feature slices across frontend and backend), built the AWS stack and the GitHub Actions pipeline that ships it, own observability, and review every PR the team opens.",
    outcome:
      "Everything Blinka runs ships through one pipeline and one set of dashboards, and the technical groundwork for its new banking division is in place.",
    technologies: ["AWS Lambda", "RDS", "API Gateway", "CloudFront", "CloudWatch", "GitHub Actions", "TypeScript"],
    facts: [
      { value: "1", label: "infrastructure engineer" },
      { value: "every", label: "PR reviewed before it merges" },
    ],
    href: "/work/blinka",
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
    summary: "An automata library I wrote for 200+ students as a research assistant, rebuilt years later as my thesis library.",
    problem:
      "Students in Lenguajes y Máquinas proved things about automata on paper but had no hands-on way to build one and watch it run.",
    did: "As a research assistant I wrote GOLD-python, an open-source library for building and simulating DFAs, NFAs and ε-NFAs, with union and conversion between them. For my thesis I rebuilt the idea as mercury-lib: DFAs, with a d3 visualizer.",
    outcome:
      "200+ students used GOLD-python in the course. mercury-lib's renderer is the ancestor of the automaton at the top of this page.",
    technologies: ["Python", "Graph traversal", "d3"],
    facts: [{ value: "200+", label: "students in Lenguajes y Máquinas" }],
    href: "/work/gold-to-mercury",
    external: { label: "mercury-lib on GitHub", href: "https://github.com/Nicolas-Saavedra/mercury-lib" },
  },
  {
    slug: "noestassolx",
    order: 3,
    title: "NoEstasSolx",
    short: "NoEstasSolx",
    org: "Universidad de los Andes",
    role: "Full Stack Developer, team of 6",
    period: { start: "2025-01", end: "2025-06", label: "Jan – Jun 2025" },
    summary: "A platform 1,000+ first-semester students used to reach academic and wellbeing services, plus the tools staff ran it with.",
    problem:
      "First-semester students had 20+ institutional services spread across offices and websites, and the staff running their induction did much of it by hand.",
    did: "In a team of 6, I built the features that give students real-time access to 20+ services in React and FastAPI, built internal tools and messaging for staff on FastAPI, Docker, NGINX and Traefik, and automated deploys with GitHub Actions.",
    outcome: "1,000+ first-semester students adopted it, and releases went out through a pipeline instead of by hand.",
    technologies: ["React", "FastAPI", "Docker", "NGINX", "Traefik", "GitHub Actions"],
    facts: [
      { value: "1,000+", label: "first-semester students" },
      { value: "20+", label: "institutional services" },
      { value: "6", label: "people on the team" },
    ],
    href: "/work/noestassolx",
  },
  {
    slug: "teaching",
    order: 4,
    title: "Teaching frontend, from HTML to React",
    short: "Teaching",
    org: "Universidad de los Andes",
    role: "Instructor, Continuing Education; before that, programming tutor",
    period: { start: "2023-08", end: "present", label: "2023 – now" },
    summary: "I've taken 150+ people from their first HTML tag to React, after tutoring 40+ students a semester.",
    problem: "People joining the Continuing Education frontend course need to go from no web background to building a React app in one course.",
    did: "I teach the course end to end: HTML, CSS layout with Flexbox and Grid, Git, Tailwind, React and React Query. Before that I tutored programming one on one: data structures, recursion, memory, pandas and NumPy.",
    outcome: "150+ students have taken the course with me so far, and I tutored 40+ students each semester before it.",
    technologies: ["HTML", "CSS", "Git", "Tailwind", "React", "React Query"],
    facts: [
      { value: "150+", label: "students taught, HTML to React" },
      { value: "40+", label: "students tutored per semester" },
    ],
    href: "/work/teaching",
  },
];

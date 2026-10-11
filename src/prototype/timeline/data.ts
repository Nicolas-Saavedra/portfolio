// PROTOTYPE: throwaway. The Timeline's content as typed data, shared by every variant so they differ in
// design, not in facts. Shaped after the spec's content model (issue #1, "Content model"), plus two
// prototype-only fields (`context`, `caseStudy`) that may become schema proposals if a variant needs them.
// Facts come from the LinkedIn export. Hard counts only; soft percentages were dropped on purpose.

export type TrackId = "engineering" | "teaching";

/** "YYYY-MM". */
export type YearMonth = `${number}-${string}`;

export interface TimelineEntry {
  id: string;
  track: TrackId;
  organization: string;
  /** Prototype-only: the team, unit or product inside the organization, so five Uniandes roles don't blur together. */
  context?: string;
  title: string;
  start: YearMonth;
  end: YearMonth | "present";
  location: string;
  /** One line, first person. */
  summary: string;
  /** A short list, hard counts only. */
  highlights: string[];
  /** Prototype-only: the Case Study this role leads into, if any. Selected Work stub anchors are `#case-<slug>`. */
  caseStudy?: { slug: string; title: string };
  /** Copy pending clearance (Blinka). Variants should show it's a draft somewhere unobtrusive. */
  draft?: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  start: YearMonth;
  end: YearMonth;
  location: string;
}

export const TRACKS: { id: TrackId; label: string; blurb: string }[] = [
  { id: "engineering", label: "Engineering", blurb: "Building production software" },
  { id: "teaching", label: "Teaching", blurb: "Instructing and tutoring" },
];

/** Newest first within each Track. */
export const ENTRIES: TimelineEntry[] = [
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
    caseStudy: { slug: "blinka", title: "Running Blinka's infrastructure" },
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
    caseStudy: { slug: "noestassolx", title: "NoEstasSolx" },
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
      "Used by 200+ students in the Languages and Machines course",
      "Simulation, union and conversion between automaton representations, built on graph traversal",
    ],
    caseStudy: { slug: "gold-mercury", title: "From GOLD-python to mercury-lib" },
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
    highlights: [
      "150+ students taught",
      "From Flexbox and Grid to Git, Tailwind and React Query",
    ],
    caseStudy: { slug: "teaching", title: "Teaching" },
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
    highlights: [
      "40+ students per semester",
      "Linked lists, trees and graphs, recursion and memory, pandas and NumPy",
    ],
    caseStudy: { slug: "teaching", title: "Teaching" },
  },
];

export const EDUCATION: Education = {
  institution: "Universidad de los Andes",
  degree: "Bachelor's in Systems and Computing Engineering",
  start: "2020-01",
  end: "2026-03",
  location: "Bogotá, Colombia",
};

/** The CV link. A placeholder for now: the real one is generated at build time (spec, "CV generation"). */
export const CV = { href: "/cv.pdf", label: "Download CV (PDF)" };

/** "Now", as "YYYY-MM". The real site would fix this at build time. */
export const NOW: YearMonth = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` as YearMonth;
})();

/** Months since year 0, for arithmetic. `"present"` resolves to NOW. */
export function monthIndex(ym: YearMonth | "present"): number {
  const [y, m] = (ym === "present" ? NOW : ym).split("-").map(Number);
  return y * 12 + (m - 1);
}

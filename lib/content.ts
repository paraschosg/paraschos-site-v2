export const site = {
  name: "George Paraschos",
  handle: "paraschosg",
  email: "george@paraschos.site",
  url: "https://paraschos.site",
  linkedin: "https://www.linkedin.com/in/georgios-paraschos-1a366521b/",
  github: "https://github.com/paraschosg",
  location: "Athens, Greece",
  role: "Software engineer",
  tagline: "I build backend systems that stay honest under load.",
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  detail: string[];
  stack: string[];
  href: string;
  kind: "solo" | "coursework" | "work";
  year: string;
};

export const projects: Project[] = [
  {
    slug: "airline",
    title: "Airline management system",
    summary: "Flight booking end to end, with a state machine that refuses to let a flight board twice.",
    detail: [
      "Flight lifecycle modelled as Scheduled → Boarding → Departed → Arrived, enforced in the domain layer, not the UI.",
      "REST API on Spring Boot and Spring Data JPA over MySQL.",
      "Frontend in plain JavaScript — no framework, no build step.",
    ],
    stack: ["Spring Boot", "Spring Data JPA", "MySQL", "JavaScript"],
    href: "https://github.com/paraschosg/airline-management-system",
    kind: "solo",
    year: "2025",
  },
  {
    slug: "distributed",
    title: "Distributed systems labs",
    summary: "The classic algorithms, implemented from the papers and made to actually agree with each other over UDP.",
    detail: [
      "Ricart–Agrawala mutual exclusion, Lamport and vector clocks with space-time diagrams.",
      "Bully and Chang–Roberts leader election.",
      "Pastry DHT routing and a concurrent UDP server in Java.",
    ],
    stack: ["Java", "UDP", "Concurrency"],
    href: "https://github.com/paraschosg",
    kind: "coursework",
    year: "2025",
  },
  {
    slug: "crypto",
    title: "Cryptography implementations",
    summary: "RSA, ElGamal and DSA built from number theory up, then attacked to see where they break.",
    detail: [
      "Working implementations of RSA, ElGamal and DSA.",
      "Håstad's broadcast attack against low-exponent RSA.",
      "Group-theory problems in Z*ₙ and vulnerability analysis.",
    ],
    stack: ["Python", "Number theory"],
    href: "https://github.com/paraschosg",
    kind: "coursework",
    year: "2024",
  },
];

export const stack: Record<string, string[]> = {
  "Languages": ["Java", "Python", "TypeScript", "SQL", "Bash"],
  "Backend": ["Spring Boot", "Spring Data JPA", "Hibernate", "Node.js", "Express"],
  "Data": ["MySQL", "PostgreSQL", "Supabase"],
  "Theory I actually use": ["Distributed systems", "Concurrency", "Cryptography"],
  "Tools": ["Git", "IntelliJ IDEA", "Linux", "Docker", "Vercel", "Railway"],
};

export const now = [
  "Finishing my degree in Information & Communication Systems Engineering at the University of the Aegean.",
  "Part-time software programmer at Talent since April 2026.",
  "Building an Android permission auditor and a GDPR cookie scanner on the side.",
  "Learning system design properly instead of by accident.",
];

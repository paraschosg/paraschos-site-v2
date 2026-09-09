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
    slug: "camera-sense",
    title: "Camera Sense",
    summary: "Hands-free computer control through a webcam — gesture, head and emotion tracking, all on-device.",
    detail: [
      "Tracks up to two hands and names the gesture: fist, pinch, peace, thumbs up and more; drives the real mouse and keyboard via a local Python bridge.",
      "Head pointer mode: move the cursor with your head, open your mouth to click, tilt to scroll.",
      "Emotion detection from 52 face blendshapes; room light analysis and frame stats.",
      "All inference runs in the browser via MediaPipe — no video leaves the machine.",
    ],
    stack: ["JavaScript", "MediaPipe", "Python", "WebSocket", "pynput"],
    href: "https://github.com/paraschosg/Camera-recognition",
    kind: "solo",
    year: "2025",
  },
  {
    slug: "image-inspector",
    title: "Image Inspector",
    summary: "Open any image and see everything: metadata, GPS, colour palette, privacy flags and raw container structure.",
    detail: [
      "EXIF grouped into camera settings, capture data and GPS with decimal coordinates and a map link.",
      "Privacy tab ranks metadata that could identify a person, device or place — serial numbers, author, embedded thumbnails, XMP.",
      "MD5 / SHA-1 / SHA-256 / CRC32 fingerprints and a full walk of every PNG chunk or JPEG segment.",
      "Headless inspector.py engine works standalone for scripting without the UI.",
    ],
    stack: ["Python", "Tkinter", "Pillow", "EXIF"],
    href: "https://github.com/paraschosg/image-inspector",
    kind: "solo",
    year: "2025",
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
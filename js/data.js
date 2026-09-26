// All the site's content lives here. Edit freely.

export const CONFIG = {
  name: 'George Paraschos',
  email: 'george@paraschos.site',
  github: 'https://github.com/paraschosg',
  linkedin: 'https://www.linkedin.com/in/georgios-paraschos-1a366521b/',
  // Where the contact form POSTs. /api/contact is the Vercel function in api/contact.js.
  // Leave empty and the form opens the visitor's mail client instead.
  formEndpoint: '/api/contact',
  timeZone: 'Europe/Athens',
};

// stats are 0–5 bars on the project screen
export const PROJECTS = [
  {
    id: 'image-inspector',
    obj: 'inspector',
    title: 'Image Inspector',
    kind: 'Desktop app',
    year: '2026',
    desc: 'Open any image and see everything about it: file facts, EXIF and GPS metadata, colour palette, privacy flags, hashes and the raw PNG / JPEG structure. Everything runs locally. Nothing is uploaded.',
    stats: { backend: 3, vision: 4, ui: 4, privacy: 5 },
    stack: ['Python', 'Tkinter', 'Pillow', 'EXIF'],
    link: 'https://github.com/paraschosg/image-inspector',
  },
  {
    id: 'camera-recognition',
    obj: 'webcam',
    title: 'Camera Recognition',
    kind: 'Computer vision',
    year: '2026',
    desc: 'A browser app that watches through your webcam and tells you what it sees: hand gestures, mood, room light. It even lets you drive the real mouse and keyboard hands-free. All inference runs on-device.',
    stats: { backend: 2, vision: 5, ui: 4, privacy: 5 },
    stack: ['JavaScript', 'MediaPipe', 'Python', 'WebSocket'],
    link: 'https://github.com/paraschosg/Camera-recognition',
  },
  {
    id: 'airline',
    obj: 'plane',
    title: 'Airline Management System',
    kind: 'Backend system',
    year: '2025',
    desc: 'Flight booking end to end, with a state machine that refuses to let a flight board twice. The flight lifecycle (Scheduled → Boarding → Departed → Arrived) is enforced in the domain layer, not the UI.',
    stats: { backend: 5, vision: 0, ui: 2, privacy: 3 },
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'MySQL'],
    link: 'https://github.com/paraschosg/airline-management-system',
  },
];

export const STAT_LABELS = [['backend', 'BACKEND'], ['vision', 'VISION'], ['ui', 'UI'], ['privacy', 'PRIVACY']];

// the "player card" on the About page
export const PLAYER = [
  ['NAME', 'George Paraschos'],
  ['CLASS', 'Software Engineer'],
  ['GUILD', 'Talent · part-time since 04/2026'],
  ['TRAINING', 'ICSE @ University of the Aegean'],
  ['BASE', 'Athens, GR'],
  ['STATUS', 'Open to work'],
];

// the dialogue box on the About page (click / Enter for the next line)
export const STORY = [
  "Hey, I'm George. Welcome to my corner of the internet.",
  "I'm a software engineer from Athens.",
  "I'm finishing my degree in Information & Communication Systems Engineering at the University of the Aegean.",
  'Since April 2026 I also work part-time as a software developer at Talent.',
  'I build backend systems that stay honest under load, and tools that can see.',
  'The cat is the real senior engineer here. I just type.',
];

export const SKILLS = [
  { group: 'LANGUAGES', items: ['Java', 'Python', 'TypeScript', 'JavaScript', 'SQL', 'Bash'] },
  { group: 'BACKEND & DATA', items: ['Spring Boot', 'Spring Data JPA', 'Hibernate', 'Node.js', 'Express', 'MySQL', 'PostgreSQL', 'Supabase'] },
  { group: 'TOOLS & VISION', items: ['Git', 'Docker', 'Linux', 'IntelliJ IDEA', 'Vercel', 'Railway', 'MediaPipe', 'Pillow'] },
  { group: 'THEORY I ACTUALLY USE', items: ['Distributed systems', 'Concurrency', 'Cryptography'] },
];

// side quests = what I'm working on now
export const QUESTS = [
  { name: 'Android permission auditor', state: 'IN PROGRESS' },
  { name: 'GDPR cookie scanner', state: 'IN PROGRESS' },
  { name: 'Learn system design properly', state: 'ONGOING' },
  { name: 'Finish my degree @ Aegean', state: 'FINAL YEAR' },
  { name: 'Ship paraschos.site v4', state: 'DONE', done: true },
];

export const TICKER = [
  'SOFTWARE ENGINEER', 'ATHENS, GR', 'BACKEND · COMPUTER VISION', 'OPEN TO WORK',
  'NOW: GDPR COOKIE SCANNER', 'SPRING BOOT · PYTHON · JS', 'PRESS ↑↓←→ TO MOVE',
];

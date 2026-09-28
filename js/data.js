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
    id: 'ciphervault',
    obj: 'vault',
    title: 'CipherVault',
    kind: 'Encryption app',
    year: '2026',
    desc: 'A desktop vault that encrypts text, files and passwords with AES-256-GCM, ChaCha20, Serpent and more. Member and admin accounts, a password vault that only your own key opens, and a 3D cipher cube that scrambles as you encrypt.',
    stats: { backend: 4, vision: 0, ui: 5, privacy: 5 },
    stack: ['Java 25', 'JavaFX', 'Bouncy Castle', 'SQLite'],
    // the repo is private, so the project page shows these instead of a source link
    shots: [
      { src: 'img/ciphervault/sign-in.png', caption: 'SIGN IN · SPIN THE 3D CORE', alt: 'CipherVault sign-in screen with a 3D crystal core and orbiting data rings' },
      { src: 'img/ciphervault/text.png', caption: 'TEXT · AES-256-GCM + CIPHER CUBE', alt: 'CipherVault encrypting a message with AES-256-GCM next to the 3D cipher cube' },
    ],
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

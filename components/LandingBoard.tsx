"use client";

import { useEffect, useState } from "react";
import FlipBoard from "./FlipBoard";

// Messages the landing board rotates through. Use \n for a line break;
// longer lines wrap by word to fit the board.
export const MESSAGES: string[] = [
  "GEORGE PARASCHOS\nBACKENDS THAT STAY\nHONEST UNDER LOAD.",
  "SOFTWARE ENGINEER\nATHENS, GREECE",
  "OPEN TO INTERNSHIPS\nAND COLLABORATIONS",
  "SPRING BOOT\nDISTRIBUTED SYSTEMS\nCRYPTOGRAPHY",
  "PRESS CMD+K\nTO LOOK AROUND",
];

const EVERY_MS = 5000;

export default function LandingBoard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), EVERY_MS);
    return () => clearInterval(id);
  }, []);

  return <FlipBoard text={MESSAGES[index]} />;
}

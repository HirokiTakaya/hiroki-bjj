"use client";

import { useState, useEffect } from "react";

type Column = {
  chars: string;
  fontSize: number;
  duration: number;
  delay: number;
  topOffset: number;
  left: number;
};

export default function KanjiRain() {
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    const kanjiList = "柔術道場武勇気力技心魂闘勝負帯拳蹴投絞極";
    const count = 18;
    const cols: Column[] = [];

    for (let i = 0; i < count; i++) {
      const chars = Array.from(
        { length: 12 },
        () => kanjiList[Math.floor(Math.random() * kanjiList.length)]
      ).join("");

      cols.push({
        chars,
        fontSize: 18 + Math.random() * 14,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 10,
        topOffset: Math.random() * 100,
        left: (i / count) * 100,
      });
    }

    setColumns(cols);
  }, []);

  if (columns.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 0.04,
        pointerEvents: "none",
      }}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            color: "white",
            left: `${col.left}%`,
            top: `-${col.topOffset}%`,
            fontSize: `${col.fontSize}px`,
            fontFamily: "'Noto Serif JP', serif",
            writingMode: "vertical-rl",
            letterSpacing: "0.5em",
            animation: `kanjifall ${col.duration}s linear infinite`,
            animationDelay: `${col.delay}s`,
          }}
        >
          {col.chars}
        </div>
      ))}
    </div>
  );
}
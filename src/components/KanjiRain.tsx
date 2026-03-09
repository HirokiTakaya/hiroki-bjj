"use client";

import { useState, useEffect } from "react";

type Column = {
  text: string;
  fontSize: number;
  duration: number;
  delay: number;
  topOffset: number;
  left: number;
};

const BUDO_WORDS = [
  "礼",
  "志",
  "道",
  "心",
  "武",
  "仁",
  "義",
  "勇",
  "誠",
  "忍",
  "克己",
  "精進",
  "不動心",
  "初心",
  "残心",
  "気合",
  "覚悟",
  "修行",
  "一期一会",
  "不屈",
  "柔よく剛を制す",
  "七転八起",
  "以心伝心",
  "和",
  "敬",
  "信",
  "鍛錬",
  "無心",
  "求道",
  "感謝",
];

export default function KanjiRain() {
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    const count = 16;
    const cols: Column[] = [];
    const shuffled = [...BUDO_WORDS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const word = shuffled[i % shuffled.length];

      cols.push({
        text: word,
        fontSize: 18 + Math.random() * 16,
        duration: 18 + Math.random() * 22,
        delay: Math.random() * 12,
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
        opacity: 0.05,
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
            letterSpacing: "0.8em",
            animation: `kanjifall ${col.duration}s linear infinite`,
            animationDelay: `${col.delay}s`,
            whiteSpace: "nowrap",
          }}
        >
          {col.text}
        </div>
      ))}
    </div>
  );
}
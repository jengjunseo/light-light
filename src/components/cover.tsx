"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";
import { useState } from "react";

export function Cover({ src, title, priority = false }: { src: string; title: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="cover-placeholder" aria-label={`${title} 표지 없음`}>
        <span className="cover-placeholder-mark">LNC</span>
        <BookOpen size={26} aria-hidden="true" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`${title} 표지`}
      fill
      sizes="(max-width: 720px) 34vw, 150px"
      className="cover-image"
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}

"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Dialog({
  title,
  children,
  onClose,
  size = "standard",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "standard" | "wide";
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`dialog-panel dialog-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="닫기">
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}

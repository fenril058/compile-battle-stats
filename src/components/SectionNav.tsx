import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import type { TranslationKey } from "../i18n/ja";

type SectionEntry = { id: string; labelKey: TranslationKey };

const SECTIONS: SectionEntry[] = [
  { id: "stat", labelKey: "nav.stat" },
  { id: "strength", labelKey: "nav.strength" },
  { id: "synergy", labelKey: "nav.synergy" },
  { id: "trio", labelKey: "nav.trio" },
  { id: "quadrant", labelKey: "nav.quadrant" },
  { id: "usage", labelKey: "nav.usage" },
  { id: "matrix", labelKey: "nav.matrix" },
  { id: "archetype", labelKey: "nav.archetype" },
];

export const SectionNav: React.FC = () => {
  const { t } = useT();
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" },
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const el = navRef.current?.querySelector<HTMLElement>(
      `[href="#${activeId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <nav
      ref={navRef}
      aria-label={t("nav.aria")}
      className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800"
    >
      <ul
        className="flex gap-1 px-3 py-2 max-w-7xl mx-auto overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {SECTIONS.map(({ id, labelKey }) => (
          <li key={id} className="flex-shrink-0">
            <a
              href={`#${id}`}
              aria-current={activeId === id ? "true" : undefined}
              className={`block px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                activeId === id
                  ? "bg-zinc-500 text-white font-medium"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t(labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

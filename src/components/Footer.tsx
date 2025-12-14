import type React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="text-center text-xs text-zinc-400">
      2025 りゅー(
      <a
        href="https://x.com/suke69"
        target="_blank"
        rel="noreferrer"
        className="text-blue-400 hover:underline"
      >
        @suke69
      </a>
      ) & ril (
      <a
        href="https://x.com/fenril_nh"
        target="_blank"
        rel="noreferrer"
        className="text-blue-400 hover:underline"
      >
        @fenril_nh
      </a>
      )
    </footer>
  );
};

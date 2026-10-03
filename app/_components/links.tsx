"use client";

import type { MouseEvent, ReactNode } from "react";
import { navigate } from "./hooks";

export function safeHref(url: string): string {
  return /^https:\/\//i.test(url) ? url : "#";
}

/** An external link that always opens in a new tab without referrer leakage. */
export function ExternalLink({
  href,
  children,
  className = "source-link",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={safeHref(href)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** An in-app link: a real href for new tabs and sharing, client navigation for plain clicks. */
export function NavLink({
  href,
  children,
  className,
  current = false,
  onNavigate,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  current?: boolean;
  onNavigate?: () => void;
  "aria-label"?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-current={current ? "page" : undefined}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        navigate(href);
        onNavigate?.();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

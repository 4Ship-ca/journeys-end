import type { NavState } from "./navigation";

export const SITE_NAME = "Worth the Detour";
export const DEFAULT_TITLE = `${SITE_NAME} — Your interests, out in the world`;

const VIEW_TITLES = { day: "On this day", places: "Places", about: "Our approach" } as const;

/** The document title for a navigation state; shared by server metadata and client navigation. */
export function titleFor(nav: NavState, entryTitle?: string): string {
  if (entryTitle) return `${entryTitle.replace(/\.$/, "")} — ${SITE_NAME}`;
  if (nav.view !== "explore") return `${VIEW_TITLES[nav.view]} — ${SITE_NAME}`;
  if (nav.research) return `Research: ${nav.research} — ${SITE_NAME}`;
  return DEFAULT_TITLE;
}

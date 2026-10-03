"use client";

import { Camera, Car, Compass, Landmark, Leaf, Plane, Plus } from "lucide-react";
import type { Entry } from "../data";
import { NavLink } from "./links";

export function InterestIcon({ interest, size, className }: { interest: string; size: number; className?: string }) {
  const props = { size, className, "aria-hidden": true } as const;
  switch (interest) {
    case "Aviation":
      return <Plane {...props} />;
    case "History":
      return <Landmark {...props} />;
    case "Photography":
      return <Camera {...props} />;
    case "Motoring":
      return <Car {...props} />;
    case "Outdoors":
      return <Leaf {...props} />;
    default:
      return <Compass {...props} />;
  }
}

export function EntryCard({ entry, href, reason }: { entry: Entry; href: string; reason?: string }) {
  return (
    <article className="card">
      <InterestIcon interest={entry.tags[0]} className="card-icon" size={23} />
      <div className="meta">
        {entry.label} <span aria-hidden="true">·</span> {entry.region}
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.description}</p>
      {reason && <p className="card-reason">{reason}</p>}
      <NavLink href={href} className="text-button" aria-label={`Explore this connection: ${entry.title}`}>
        Explore this connection <Plus size={14} aria-hidden="true" />
      </NavLink>
    </article>
  );
}

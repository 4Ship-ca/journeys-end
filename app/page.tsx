import type { Metadata } from "next";
import Detour from "./_components/detour";
import { getEntry, isKnownId } from "./data";
import { parseNav } from "../lib/detour/navigation";
import { titleFor } from "../lib/detour/titles";

type SearchParams = Record<string, string | string[] | undefined>;

function toSearch(params: SearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    for (const item of values) search.append(key, item);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const nav = parseNav(toSearch(await searchParams), isKnownId);
  const current = nav.trail.length ? getEntry(nav.trail[nav.trail.length - 1]) : undefined;
  return {
    title: titleFor(nav, current?.title),
    ...(current ? { description: current.description } : {}),
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Detour initialSearch={toSearch(await searchParams)} />;
}

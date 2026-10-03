export const INTERESTS = ["Aviation", "History", "Photography", "Motoring", "Outdoors"] as const;
export type Interest = (typeof INTERESTS)[number];

export const REGIONS = ["Ontario", "Japan"] as const;
/** A browsing label, not a claim that a subject exists only in that region. */
export type Region = (typeof REGIONS)[number] | "Anywhere";

/**
 * story      — something to read or follow; never a physical stop.
 * place      — a mapped location with coordinates and a time zone.
 * experience — an activity offered by a provider; location and availability unconfirmed.
 */
export type EntryKind = "story" | "place" | "experience";

export type Media = {
  src: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  sourceUrl: string;
  licence: string;
  licenceUrl: string;
  adaptation: string;
  /** CSS object-position for the cropped feature image. */
  focus?: string;
};

type EntryBase = {
  id: string;
  title: string;
  label: string;
  region: Region;
  description: string;
  body: string;
  tags: Interest[];
  /** Explicit, curated relationships. Not distances and not learned relevance. */
  links: string[];
  /** Primary external destination. */
  source: string;
  sourceLabel: string;
  /** Research search terms. */
  query: string;
  /** Wording, not a numeric price quote. */
  cost: string;
  image?: Media;
};

export type Story = EntryBase & { kind: "story" };

export type Place = EntryBase & {
  kind: "place";
  lat: number;
  lon: number;
  /** IANA time zone used for forecasts and visit dates. */
  timeZone: string;
  zoneLabel: string;
  /** Short name used in the conditions selector. */
  placeName: string;
  /** Editorial visit estimate in minutes, excluding travel. */
  duration: number;
  locationNote: string;
};

export type Experience = EntryBase & {
  kind: "experience";
  /** Editorial estimate in minutes, excluding travel. */
  duration: number;
};

export type Entry = Story | Place | Experience;

export const entries: Entry[] = [
  {
    id: "lancaster",
    kind: "story",
    title: "A living connection to the past.",
    label: "Aircraft & history",
    region: "Ontario",
    description: "Follow the Lancaster story from wartime engineering to a museum visit in Hamilton.",
    body: "Start with the aircraft, then follow the people and places that keep its history alive. Canadian Warplane Heritage’s aircraft record is the starting source. A museum visit and a flight experience are different plans: check the operator for display access, flight dates and availability.",
    tags: ["Aviation", "History", "Photography"],
    links: ["warplane", "jetage", "spotting"],
    source: "https://www.warplane.com/aircraft/collection/details.aspx?aircraftid=4",
    sourceLabel: "Visit the source",
    query: "Avro Lancaster Canadian Warplane Heritage",
    cost: "Explore freely",
    image: {
      src: "/images/lancaster.jpg",
      width: 1600,
      height: 900,
      alt: "An Avro Lancaster bomber on display inside the Canadian Warplane Heritage hangar, with visitors walking beneath its wing.",
      author: "JustSomePics",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Avro_Lancaster_FM213_CWHM_p11.jpg",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      adaptation: "Resized, cropped and toned for display; the adaptation remains CC BY-SA 4.0.",
      focus: "center 56%",
    },
  },
  {
    id: "warplane",
    kind: "place",
    title: "Meet the aircraft in Hamilton",
    label: "Museum visit",
    region: "Ontario",
    description: "Make Canadian Warplane Heritage the centre of a thoughtful aviation day out.",
    body: "Browse the official collection before you go and pick the aircraft you most want to see. Leave room for the stories attached to them. The time allowance is a planning suggestion, not an official tour duration. Collection membership does not guarantee an aircraft is on display on your chosen date.",
    tags: ["Aviation", "History", "Photography"],
    links: ["lancaster", "spotting", "memorials"],
    source: "https://www.warplane.com/visit/museum-hours-and-prices.aspx",
    sourceLabel: "Hours and admission",
    query: "Canadian Warplane Heritage Museum",
    cost: "Check admission",
    lat: 43.1603,
    lon: -79.9246,
    timeZone: "America/Toronto",
    zoneLabel: "Eastern time",
    placeName: "Hamilton · Warplane Heritage",
    duration: 150,
    locationNote: "Approximate museum location",
  },
  {
    id: "hornet",
    kind: "story",
    title: "Follow the Canadian Hornet story",
    label: "Subject trail",
    region: "Ontario",
    description: "Development, Canadian service and the changing plans for the fleet’s future.",
    body: "Build a trail through aircraft development, Canadian selection, service and upgrades. Keep selection, contract, delivery and entry into service as separate events. For replacement and retirement, use dated official updates rather than repeating an old target as a current promise.",
    tags: ["Aviation", "History"],
    links: ["warplane", "spotting", "jetage"],
    source: "https://www.canada.ca/en/department-national-defence/services/procurement/fighter-jets/supplementing-cf-18-fleet.html",
    sourceLabel: "Read the official update",
    query: "CF-18 Hornet Canada history",
    cost: "Explore freely",
  },
  {
    id: "jetage",
    kind: "story",
    title: "When the journey was the occasion",
    label: "From the archive",
    region: "Anywhere",
    description: "Step into 1958 with the archival film 6½ Magic Hours.",
    body: "This period film presents transatlantic air travel at the beginning of the jet age. Watch it as a contemporary sales pitch as well as a record of travel. The Internet Archive item labels the film public domain; verify provenance and rights before republishing or adapting it.",
    tags: ["Aviation", "History"],
    links: ["lancaster", "hornet", "japan"],
    source: "https://archive.org/details/612Magic1958",
    sourceLabel: "Watch the archival film",
    query: "jet age Pan American 1958",
    cost: "Watch freely",
  },
  {
    id: "japan",
    kind: "story",
    title: "Take the long way, in Japan.",
    label: "A worthwhile side quest",
    region: "Japan",
    description: "A favourite car, a winding road, and a different way to remember the trip.",
    body: "Build a day around an interest you have carried for years. Start by investigating specialist rental operators, then check the actual pickup location, vehicle availability, licence eligibility, insurance and permitted routes directly. The Hakone image is inspiration, not a pre-checked rental itinerary.",
    tags: ["Motoring", "Photography", "Outdoors"],
    links: ["cars", "honda", "spotting"],
    source: "https://www.omoren.com/en/",
    sourceLabel: "Visit the source",
    query: "Japan sports car heritage driving",
    cost: "Plan your budget",
    image: {
      src: "/images/hakone.jpg",
      width: 1600,
      height: 1200,
      alt: "The Hakone Skyline road curving through dry grassland and wooded hills, with mountain ridges beyond.",
      author: "Guilhem Vellut",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Hakone_Skyline_Road_@_Panorama_@_Yamabushi_Pass_@_Hakone_(13776985624).jpg",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
      adaptation: "Resized, cropped and toned for display.",
      focus: "center 70%",
    },
  },
  {
    id: "cars",
    kind: "experience",
    title: "Find your dream-car experience",
    label: "Experience lead",
    region: "Japan",
    description: "Explore a specialist operator, then check the details that make the day work.",
    body: "Omoshiro Rent-A-Car is a research lead, not a booking endorsement. Confirm the branch, the exact car, costs, deposit and conditions with the operator. Add a pickup location to your route only once your chosen branch is confirmed. No booking is made here.",
    tags: ["Motoring", "Outdoors"],
    links: ["honda", "japan"],
    source: "https://www.omoren.com/en/",
    sourceLabel: "Check cars & booking",
    query: "Japanese sports car history Nissan Skyline",
    cost: "Check operator pricing",
    duration: 240,
  },
  {
    id: "honda",
    kind: "place",
    title: "Follow the engineering to Motegi",
    label: "Museum visit",
    region: "Japan",
    description: "Connect a love of cars to Honda’s collection and its engineering history.",
    body: "Honda Collection Hall is at Mobility Resort Motegi in Tochigi. Honda announced a renewed exhibition in 2024. Check the current official visitor information before making a journey; do not assume it is a quick detour from Tokyo or Hakone.",
    tags: ["Motoring", "History"],
    links: ["cars", "japan"],
    source: "https://global.honda/jp/collection-hall/",
    sourceLabel: "Visitor information",
    query: "Honda Collection Hall Motegi",
    cost: "Check admission",
    lat: 36.532,
    lon: 140.227,
    timeZone: "Asia/Tokyo",
    zoneLabel: "Japan time",
    placeName: "Motegi · Honda Collection Hall",
    duration: 120,
    locationNote: "Approximate museum location",
  },
  {
    id: "spotting",
    kind: "story",
    title: "A little preparation. Better photographs.",
    label: "Photography field notes",
    region: "Anywhere",
    description: "Choose a lawful viewing place, check the weather, and use the equipment you have.",
    body: "Look for documented public access, safe parking and a clear view. A map pin is not permission to enter. Check local restrictions and current notices. Start with your existing camera and lens; add weather protection or a spare battery only if your plan calls for it. Live aircraft positions do not guarantee an appearance.",
    tags: ["Photography", "Aviation", "Outdoors"],
    links: ["warplane", "japan", "memorials"],
    source: "https://www.warplane.com/visit/museum-faq.aspx",
    sourceLabel: "Read the museum FAQ",
    query: "aviation photography aircraft spotting",
    cost: "Use what you own",
  },
  {
    id: "memorials",
    kind: "story",
    title: "Small places. Stories worth stopping for.",
    label: "Find a local connection",
    region: "Ontario",
    description: "Look beyond the museum to memorials, plaques and community aviation history.",
    body: "Veterans Affairs Canada’s memorial directory is a starting point for finding commemorative places. Verify the location, public access and what is actually there. A plaque, a replica and an original aircraft each tell a different kind of story.",
    tags: ["History", "Outdoors"],
    links: ["warplane", "lancaster"],
    source: "https://www.veterans.gc.ca/en/remembrance/memorials",
    sourceLabel: "Open the memorial directory",
    query: "Canadian aviation memorial",
    cost: "Check access",
  },
];

const index = new Map<string, Entry>(entries.map((entry) => [entry.id, entry]));

export function getEntry(id: string): Entry | undefined {
  return index.get(id);
}

export function isKnownId(id: string): boolean {
  return index.has(id);
}

export function isPlace(entry: Entry | null | undefined): entry is Place {
  return entry?.kind === "place";
}

export const places: Place[] = entries.filter(isPlace);

export function getPlace(id: string): Place | undefined {
  const entry = index.get(id);
  return isPlace(entry) ? entry : undefined;
}

/** Suggested minutes for a saved item. Stories are not physical stops and count as zero. */
export function visitMinutes(entry: Entry): number {
  return entry.kind === "story" ? 0 : entry.duration;
}

/** Hosts that server-side fetches may contact or follow redirects to for a record's source. */
export function sourceHosts(entry: Entry): string[] {
  const host = new URL(entry.source).hostname;
  const bare = host.replace(/^www\./, "");
  return Array.from(new Set([host, bare, `www.${bare}`]));
}

/** A plain, explainable reason for a curated connection. */
export function connectionReason(from: Entry, to: Entry): string {
  const shared = to.tags.filter((tag) => from.tags.includes(tag));
  const what =
    to.kind === "place"
      ? "A place you can visit"
      : to.kind === "experience"
        ? "An experience to check with its provider"
        : "A connected story";
  return shared.length ? `${what} · shares ${shared.join(", ")}` : what;
}

export const imageCredits: (Media & { entryId: string })[] = entries.flatMap((entry) =>
  entry.image ? [{ ...entry.image, entryId: entry.id }] : [],
);

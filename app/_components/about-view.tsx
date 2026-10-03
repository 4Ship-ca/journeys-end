"use client";

import { imageCredits } from "../data";
import { ExternalLink } from "./links";

export function AboutView() {
  return (
    <section className="about">
      <div className="eyebrow">Independent by nature</div>
      <h2>A guide, not a sales pitch.</h2>
      <p>
        Start with something you love. Follow a connection. Keep what matters and leave the rest. This first field guide
        brings together aviation, history, photography and a few worthwhile detours.
      </p>
      <p>
        Recommendations come from explicit subject and place connections. There is no chatbot and no paid
        language-model dependency. Your journey is saved on this browser only, with an export you can keep.
      </p>
      <h3>What is live?</h3>
      <p>
        Weather is requested from MET Norway for the time of day you choose. If a refresh fails, an earlier forecast may
        be shown and is clearly labelled as stale. Archive and background searches are requested when you explore a
        subject. Official pages are fetched for potential notice wording, but opening status remains unconfirmed. A
        missing notice is not proof that a place is open.
      </p>
      <h3>A small beginning</h3>
      <p>
        Booking links take you to providers; we do not make reservations. No affiliate tracking, shop checkout, personal
        photo archive or ADS-B feed is connected in this edition. The working title can change; the aim is to help you
        explore.
      </p>
      <h3 id="credits" tabIndex={-1}>
        Photographs & sources
      </h3>
      {imageCredits.map((credit) => (
        <p key={credit.src} className="small">
          <ExternalLink href={credit.sourceUrl}>Photograph: {credit.author}</ExternalLink> ·{" "}
          <ExternalLink href={credit.licenceUrl}>{credit.licence}</ExternalLink>. {credit.adaptation}
        </p>
      ))}
      <p className="small">
        Weather: <ExternalLink href="https://api.met.no/">MET Norway</ExternalLink>,{" "}
        <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</ExternalLink>. Historical discovery
        excerpts: Wikipedia / Wikimedia contributors, subject to their attribution and licence terms. Maps: ©
        OpenStreetMap contributors.
      </p>
    </section>
  );
}

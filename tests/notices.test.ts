import { describe, expect, it } from "vitest";
import { extractNotices, htmlToText } from "../lib/detour/server/notices";

describe("htmlToText", () => {
  it("drops scripts, styles, comments and tags, and decodes common entities", () => {
    const text = htmlToText(
      "<html><head><title>T</title><style>.closure{}</style></head><body><!-- closed today --><script>var s='closure'</script><p>Fish&nbsp;&amp;&nbsp;chips &rsquo;n&rsquo; more</p></body></html>",
    );
    expect(text).toBe("Fish & chips ’n’ more");
  });
});

describe("extractNotices", () => {
  it("finds short snippets of closure wording", () => {
    const notices = extractNotices(
      "<main><p>Welcome to the museum.</p><div class='alert'>The north hangar is temporarily closed for maintenance until further notice. Thank you for your patience.</div></main>",
    );
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatch(/temporarily closed/);
    expect(notices[0].split(" ").length).toBeLessThanOrEqual(12);
  });

  it("returns at most the requested number of distinct snippets", () => {
    // Whitespace collapses, so separate the notices with real text longer than a snippet.
    const filler = `<p>${"The collection tells many stories. ".repeat(6)}</p>`;
    const page = Array.from({ length: 5 }, (_, index) => `<p>Gallery ${index} closure notice for visitors in section ${index}.</p>`).join(
      filler,
    );
    expect(extractNotices(page)).toHaveLength(2);
    expect(extractNotices(page, 4)).toHaveLength(4);
  });

  it("ignores wording hidden in scripts and returns nothing for an ordinary page", () => {
    expect(extractNotices("<script>const msg = 'closed today';</script><p>Open daily.</p>")).toEqual([]);
  });
});

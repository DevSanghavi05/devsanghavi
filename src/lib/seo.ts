/**
 * Central source of truth for site identity, SEO metadata, and structured data.
 * Every page, the sitemap, robots, manifest, and JSON-LD read from here so the
 * "Dev Sanghavi is…" story stays identical everywhere search engines look.
 */

// Canonical origin. Uses the www host because the bare apex (devsanghavi.com)
// currently serves an invalid TLS certificate (stale DNS A records point at a
// domain-forwarding service). www is on Vercel with a valid Let's Encrypt cert,
// so Googlebot can actually fetch it. Revert to the apex once the apex DNS is
// cleaned up and a valid apex cert issues.
export const SITE_URL = "https://www.devsanghavi.com";

/** Google Search Console ownership-verification token. */
export const GOOGLE_SITE_VERIFICATION = "nUPVDUwJr4p2OEa5kDuBo53hvJISn2nsEJUhKrtf8zc";

export const PERSON = {
  name: "Dev Sanghavi",
  givenName: "Dev",
  familyName: "Sanghavi",
  jobTitle: "Founder of Learnr",
  /** One-line answer to "who is Dev Sanghavi?" — kept under ~160 chars for meta descriptions. */
  tagline:
    "Dev Sanghavi is a 12-year-old developer, creator, and founder of Learnr from Houston, Texas, building high-impact consumer software and AI.",
  /** Fuller bio used for JSON-LD and richer result snippets. */
  bio:
    "Dev Sanghavi is a 12-year-old developer, creator, and the founder of Learnr, based in Houston, Texas. He builds high-impact consumer software and AI, speaks three languages fluently, plays guitar, and has traveled to 87 countries.",
  city: "Houston",
  region: "TX",
  regionName: "Texas",
  country: "US",
  image: `${SITE_URL}/profile.jpg`,
  sameAs: [
    "https://github.com/DevSanghavi05",
    "https://x.com/devsanghavi05",
  ],
  knowsAbout: [
    "Software Engineering",
    "Artificial Intelligence",
    "Web Development",
    "Product Design",
    "Entrepreneurship",
  ],
} as const;

export const ORG = {
  name: "Learnr",
  url: "https://getlearnr.com",
  description:
    "Learnr turns a user prompt into a full, personalized course. Founded by Dev Sanghavi.",
} as const;

/** Absolute default title used on the homepage and as the fallback everywhere. */
export const DEFAULT_TITLE = "Dev Sanghavi - Founder of Learnr";
/** Suffix template applied to per-page titles, e.g. "About · Dev Sanghavi". */
export const TITLE_TEMPLATE = "%s · Dev Sanghavi";

export const KEYWORDS = [
  "Dev Sanghavi",
  "Dev Sanghavi developer",
  "Dev Sanghavi Learnr",
  "Dev Sanghavi Houston",
  "Learnr founder",
  "young developer Houston",
  "Learnr",
  "Churro",
  "AI",
  "software developer",
];

/**
 * JSON-LD graph describing the person, the site, and the organization.
 * A single @graph lets search engines resolve the relationships between them
 * (Person → founder of → Organization) which is what powers a knowledge panel.
 */
export function buildPersonJsonLd() {
  const personId = `${SITE_URL}/#person`;
  const orgId = `${ORG.url}/#organization`;
  const websiteId = `${SITE_URL}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: PERSON.name,
        givenName: PERSON.givenName,
        familyName: PERSON.familyName,
        url: SITE_URL,
        image: PERSON.image,
        description: PERSON.bio,
        jobTitle: PERSON.jobTitle,
        knowsAbout: [...PERSON.knowsAbout],
        sameAs: [...PERSON.sameAs, ORG.url],
        homeLocation: {
          "@type": "Place",
          name: `${PERSON.city}, ${PERSON.regionName}`,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: PERSON.city,
          addressRegion: PERSON.region,
          addressCountry: PERSON.country,
        },
        worksFor: { "@id": orgId },
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: ORG.name,
        url: ORG.url,
        description: ORG.description,
        founder: { "@id": personId },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: PERSON.name,
        description: PERSON.tagline,
        inLanguage: "en-US",
        publisher: { "@id": personId },
        about: { "@id": personId },
      },
    ],
  };
}

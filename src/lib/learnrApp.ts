export const LEARNR_APP_ID = "6793029774";
export const LEARNR_SITE_URL = "https://getlearnr.com";
export const LEARNR_APP_STORE_URL = `https://apps.apple.com/us/app/learnr-learn-anything/id${LEARNR_APP_ID}`;
export const APP_STORE_IMAGE_HOST = "is1-ssl.mzstatic.com";

export type LearnrApp = {
  iconUrl: string | null;
  /** Average App Store rating, 0-5. */
  rating: number | null;
  ratingCount: number | null;
  price: string | null;
  appStoreUrl: string;
};

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Reads Apple's public iTunes lookup payload. Tolerant: any missing field degrades, never throws. */
export function parseLearnrApp(payload: unknown): LearnrApp | null {
  const app = (payload as { results?: unknown[] } | null)?.results?.[0] as
    | Record<string, unknown>
    | undefined;
  if (!app || typeof app !== "object") return null;

  const icon = typeof app.artworkUrl512 === "string" ? app.artworkUrl512 : null;
  const store = typeof app.trackViewUrl === "string" ? app.trackViewUrl.split("?")[0] : null;
  return {
    iconUrl: icon?.startsWith(`https://${APP_STORE_IMAGE_HOST}/`) ? icon : null,
    rating: toNumber(app.averageUserRating),
    ratingCount: toNumber(app.userRatingCount),
    price: typeof app.formattedPrice === "string" ? app.formattedPrice : null,
    appStoreUrl: store?.startsWith("https://apps.apple.com/") ? store : LEARNR_APP_STORE_URL,
  };
}

export async function getLearnrApp(): Promise<LearnrApp | null> {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${LEARNR_APP_ID}&country=us`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return parseLearnrApp(await response.json());
  } catch {
    return null;
  }
}

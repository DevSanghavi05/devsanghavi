export const DUOLINGO_USERNAME = "DevSanghavi05";
export const DUOLINGO_PROFILE_URL = `https://www.duolingo.com/profile/${DUOLINGO_USERNAME}`;

export type DuolingoStreak = {
  /** Current streak length in days. */
  days: number;
  /** First day of the streak, YYYY-MM-DD (null if Duolingo omits it). */
  startDate: string | null;
  totalXp: number | null;
  name: string | null;
  username: string;
  /** Duolingo-rendered avatar PNG, or null if the payload has none. */
  avatarUrl: string | null;
  /** Account creation day, YYYY-MM-DD. */
  joinedDate: string | null;
  courseCount: number | null;
};

export const DUOLINGO_AVATAR_HOST = "d3gq3s1iyyx31w.cloudfront.net";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Only Duolingo's own avatar CDN, so next/image can serve it. */
function toAvatarUrl(value: unknown): string | null {
  const picture = toText(value);
  if (!picture) return null;
  const url = picture.startsWith("//") ? `https:${picture}` : picture;
  return url.startsWith(`https://${DUOLINGO_AVATAR_HOST}/`) ? `${url.replace(/\/$/, "")}/xlarge` : null;
}

function toIsoDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE.test(value) ? value : null;
}

/** Reads Duolingo's public profile payload. Tolerant: any missing field degrades, never throws. */
export function parseDuolingoUser(payload: unknown): DuolingoStreak | null {
  const user = (payload as { users?: unknown[] } | null)?.users?.[0] as
    | Record<string, unknown>
    | undefined;
  if (!user || typeof user !== "object") return null;

  const current = (user.streakData as { currentStreak?: Record<string, unknown> | null } | undefined)
    ?.currentStreak;
  const days = toNumber(current?.length) ?? toNumber(user.streak);
  if (days === null || days <= 0) return null;

  const created = toNumber(user.creationDate);
  return {
    days,
    startDate: toIsoDate(current?.startDate),
    totalXp: toNumber(user.totalXp),
    name: toText(user.name),
    username: toText(user.username) ?? DUOLINGO_USERNAME,
    avatarUrl: toAvatarUrl(user.picture),
    joinedDate: created ? new Date(created * 1000).toISOString().slice(0, 10) : null,
    courseCount: Array.isArray(user.courses) ? user.courses.length : null,
  };
}

/**
 * `fresh` skips Next's data cache entirely (the browser refresh route); otherwise a
 * cached copy is reused for at most a minute so the About page stays fast.
 */
export async function getDuolingoStreak({ fresh = false } = {}): Promise<DuolingoStreak | null> {
  try {
    const fields =
      "users{streak,streakData{currentStreak},totalXp,name,username,picture,creationDate,courses{id}}";
    const response = await fetch(
      `https://www.duolingo.com/2017-06-30/users?username=${DUOLINGO_USERNAME}&fields=${encodeURIComponent(fields)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; devsanghavi.com)" },
        ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
      },
    );
    if (!response.ok) return null;
    return parseDuolingoUser(await response.json());
  } catch {
    return null;
  }
}

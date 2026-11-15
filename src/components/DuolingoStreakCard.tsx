import Image from "next/image";
import { Nunito } from "next/font/google";
import { DUOLINGO_PROFILE_URL, type DuolingoStreak } from "@/lib/duolingo";
import styles from "./DuolingoStreakCard.module.css";

// Closest open match to Duolingo's rounded, heavy type.
const nunito = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"] });

/** Surface class for the InfoPopover that hosts this card. */
export const duolingoCardClassName = `${styles.card} ${nunito.className}`;

const formatDate = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

function Flame({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 48" aria-hidden="true">
      <path
        fill="#ff9600"
        d="M20 1.5c1.6 6.3 6.7 9.9 10.8 14.6C35.2 21 38 26.4 38 32.4 38 41.3 30 47 20 47S2 41.3 2 32.4c0-6.2 2.7-10.6 6.3-14.3.6 3.9 2.4 6.6 5.2 7.6-.9-9.2 2.4-17.4 6.5-24.2Z"
      />
      <path
        fill="#ffc800"
        d="M20 23.5c3.7 4 8.4 6.8 8.4 12.6 0 5.3-3.8 8.7-8.4 8.7s-8.4-3.4-8.4-8.7c0-5.6 4.7-8.7 8.4-12.6Z"
      />
      <path
        fill="#fff3c4"
        d="M20 34c1.8 2 3.4 3.1 3.4 5.4 0 2.1-1.5 3.4-3.4 3.4s-3.4-1.3-3.4-3.4c0-2.3 1.6-3.4 3.4-5.4Z"
      />
    </svg>
  );
}

function Bolt() {
  return (
    <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#ffc800"
        d="M13.6 1.8 4.4 13.3c-.6.8 0 1.9 1 1.9h5.1l-1.3 6.6c-.2 1.1 1.2 1.7 1.9.8l9.2-11.5c.6-.8 0-1.9-1-1.9h-5.1l1.3-6.6c.2-1.1-1.2-1.7-1.9-.8Z"
      />
    </svg>
  );
}

function Flag() {
  return (
    <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="2" width="2.6" height="20" rx="1.3" fill="#1899d6" />
      <path
        fill="#1cb0f6"
        d="M6.6 3.6c3-1.6 5.6 1.4 8.6.2 1.5-.6 3.4-.9 4.6-.4v10.4c-1.2.5-3.1.8-4.6 1.4-3 1.2-5.6-1.8-8.6-.2Z"
      />
    </svg>
  );
}

/** Dev's live Duolingo profile and streak, styled after Duolingo's own profile screens. */
export function DuolingoStreakCard({ streak }: { streak: DuolingoStreak | null }) {
  return (
    <>
      {streak ? (
        <span className={styles.profile}>
          {streak.avatarUrl ? (
            <Image
              className={styles.avatar}
              src={streak.avatarUrl}
              alt={`${streak.name ?? "Dev"}'s Duolingo avatar`}
              width={64}
              height={64}
            />
          ) : null}
          <span className={styles.identity}>
            <span className={styles.name}>{streak.name ?? "Dev Sanghavi"}</span>
            <span className={styles.meta}>@{streak.username}</span>
            {streak.joinedDate ? (
              <span className={styles.meta}>
                Joined {formatDate(streak.joinedDate, { month: "long", year: "numeric" })}
              </span>
            ) : null}
          </span>
        </span>
      ) : null}

      <span className={styles.hero}>
        <span className={styles.heroText}>
          <span className={styles.count}>
            {streak ? streak.days.toLocaleString("en-US") : "1,000+"}
          </span>
          <span className={styles.unit}>day streak!</span>
          {streak?.startDate ? (
            <span className={styles.since}>
              Since {formatDate(streak.startDate, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          ) : null}
        </span>
        <Flame className={styles.flame} />
      </span>

      {streak?.totalXp || streak?.courseCount ? (
        <span className={styles.stats}>
          {streak.totalXp ? (
            <span className={styles.stat}>
              <Bolt />
              <span className={styles.statText}>
                <span className={styles.statValue}>{streak.totalXp.toLocaleString("en-US")}</span>
                <span className={styles.statLabel}>Total XP</span>
              </span>
            </span>
          ) : null}
          {streak.courseCount ? (
            <span className={styles.stat}>
              <Flag />
              <span className={styles.statText}>
                <span className={styles.statValue}>{streak.courseCount}</span>
                <span className={styles.statLabel}>Courses</span>
              </span>
            </span>
          ) : null}
        </span>
      ) : null}

      <a className={styles.button} href={DUOLINGO_PROFILE_URL} target="_blank" rel="noopener noreferrer">
        View profile
      </a>
    </>
  );
}

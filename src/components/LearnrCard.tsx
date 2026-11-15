import Image from "next/image";
import localFont from "next/font/local";
import { LEARNR_APP_STORE_URL, LEARNR_SITE_URL, type LearnrApp } from "@/lib/learnrApp";
import styles from "./LearnrCard.module.css";

// Learnr's own type: Bricolage Grotesque headlines over Quicksand UI text.
// Self-hosted (src/fonts) so builds never depend on fetching Google Fonts.
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-latin-wght.woff2",
  weight: "700 800",
  variable: "--learnr-title",
});
const quicksand = localFont({ src: "../fonts/quicksand-latin-wght.woff2", weight: "500 700" });

/** Surface class for the InfoPopover that hosts this card. */
export const learnrCardClassName = `${styles.card} ${quicksand.className} ${bricolage.variable}`;

// Example topics from Learnr's landing page, capped by the one that sums it up.
const TOPICS = [
  { name: "Photography" },
  { name: "Python" },
  { name: "Spanish" },
  { name: "Anything", accent: true },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(Math.max(rating - index, 0), 1);
        return (
          <svg key={index} viewBox="0 0 20 20" className={styles.star}>
            <defs>
              <clipPath id={`learnr-star-${index}`}>
                <rect width={20 * fill} height="20" />
              </clipPath>
            </defs>
            <path
              className={styles.starEmpty}
              d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
            />
            <path
              className={styles.starFull}
              clipPath={`url(#learnr-star-${index})`}
              d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

/** Learnr at a glance, in Learnr's own visual language, with live App Store numbers. */
export function LearnrCard({ app }: { app: LearnrApp | null }) {
  const ratingCount = app?.ratingCount ?? 0;

  return (
    <>
      <span className={styles.head}>
        <Image
          className={styles.icon}
          src={app?.iconUrl ?? "/learnr-icon.jpg"}
          alt="Learnr app icon, a smiling blue dinosaur"
          width={64}
          height={64}
        />
        <span className={styles.identity}>
          <span className={styles.title}>Learnr</span>
          <span className={styles.tagline}>
            The Duolingo for <span className={styles.highlight}>Everything</span>
          </span>
        </span>
      </span>

      <span className={styles.pitch}>
        Type any topic and get a full, personalized course with bite-sized lessons, practice and
        streaks.
      </span>

      <span className={styles.topics} role="list" aria-label="Example topics">
        {TOPICS.map(({ name, accent }) => (
          <span
            className={accent ? `${styles.topic} ${styles.topicAccent}` : styles.topic}
            role="listitem"
            key={name}
          >
            {name}
          </span>
        ))}
      </span>

      {app?.rating && ratingCount > 0 ? (
        <span className={styles.rating}>
          <Stars rating={app.rating} />
          <span className={styles.ratingValue}>{app.rating.toFixed(1)}</span>
          <span className={styles.ratingMeta}>
            {ratingCount.toLocaleString("en-US")} {ratingCount === 1 ? "rating" : "ratings"} on the App Store
          </span>
        </span>
      ) : null}

      <span className={styles.actions}>
        <a
          className={styles.primary}
          href={app?.appStoreUrl ?? LEARNR_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get the iOS app{app?.price === "Free" ? ", free" : ""}
        </a>
        <a className={styles.secondary} href={LEARNR_SITE_URL} target="_blank" rel="noopener noreferrer">
          Try it on the web
        </a>
      </span>
    </>
  );
}

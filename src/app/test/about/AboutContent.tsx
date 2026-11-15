"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { InfoPopover } from "@/components/InfoPopover";
import popoverStyles from "@/components/InfoPopover.module.css";
import { Split } from "@/components/home/Split";
import { useLetterPhysics } from "@/components/home/useLetterPhysics";
import { DuolingoStreakCard, duolingoCardClassName } from "@/components/DuolingoStreakCard";
import { LearnrCard, learnrCardClassName } from "@/components/LearnrCard";
import type { DuolingoStreak } from "@/lib/duolingo";
import type { LearnrApp } from "@/lib/learnrApp";
import letterStyles from "@/components/home/HomeHero.module.css";
import styles from "../test.module.css";

const LANGUAGES = [
  { name: "Gujarati", flag: "/flags/in.svg", country: "India" },
  { name: "English", flag: "/flags/us.svg", country: "the United States" },
  { name: "Spanish", flag: "/flags/es.svg", country: "Spain" },
];

export function AboutContent({
  streak: initialStreak,
  learnrApp,
}: {
  streak: DuolingoStreak | null;
  learnrApp: LearnrApp | null;
}) {
  // The server render may be up to a minute old; swap in Duolingo's live numbers once loaded.
  const [streak, setStreak] = useState(initialStreak);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/duolingo", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { streak?: DuolingoStreak | null } | null) => {
        if (payload?.streak?.days) setStreak(payload.streak);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const blocks = useMemo(() => [gridRef], []);

  // The title's letters are loose bodies; the photo and text below form one solid shelf for them to land on.
  const { touched, reset } = useLetterPhysics({ arena: stageRef, word: titleRef, blocks });

  return (
    <div ref={stageRef} className={styles.aboutStage}>
      <h1 id="about-heading" ref={titleRef} className={styles.aboutTitle} aria-label="About">
        <Split text="About" />
      </h1>
      {touched ? (
        <button type="button" className={`${letterStyles.reset} ${styles.aboutReset}`} onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Reset letters
        </button>
      ) : null}
      <div ref={gridRef} className={styles.aboutGrid}>
        <figure className={styles.travelFigure}>
          <Image
            className={styles.travelImage}
            src="/dev-boardwalk-portrait.png"
            alt="Dev Sanghavi walking along a wooden boardwalk by the water"
            width={580}
            height={772}
            priority
          />
        </figure>

        <div className={styles.aboutCopy}>
          <p className={styles.aboutLead}>
            Hi! I&apos;m Dev Sanghavi, a 7th grader from Houston, TX.
          </p>
          <p>
            I love to design and develop systems, mostly in consumer software.
            Right now, I&apos;m building{" "}
            <InfoPopover
              label="Learnr"
              panelLabel="About Learnr, the app Dev is building"
              width={400}
              href="https://getlearnr.com"
              cardClassName={learnrCardClassName}
            >
              <LearnrCard app={learnrApp} />
            </InfoPopover>
            , a platform that turns any prompt into a full, personalized course.
            We launched the iOS app and just hit 500 daily active users.
          </p>
          <p>
            Outside of building, I love learning languages, with a{" "}
            <InfoPopover
              label={`${streak ? `${streak.days.toLocaleString("en-US")}-day` : "1,000+ day"} Duolingo streak`}
              panelLabel="Dev's live Duolingo streak"
              width={400}
              cardClassName={duolingoCardClassName}
            >
              <DuolingoStreakCard streak={streak} />
            </InfoPopover>
            . I&apos;m fluent in{" "}
            <InfoPopover label="3 languages" panelLabel="Languages Dev speaks" width={270}>
              <span className={popoverStyles.languages} role="list">
                {LANGUAGES.map((language) => (
                  <span className={popoverStyles.language} role="listitem" key={language.name}>
                    <span>{language.name}</span>
                    <Image
                      className={popoverStyles.flag}
                      src={language.flag}
                      alt={`Flag of ${language.country}`}
                      width={36}
                      height={27}
                    />
                  </span>
                ))}
              </span>
            </InfoPopover>{" "}
            and learning a fourth.
          </p>
          <p>
            I also play guitar and have traveled to{" "}
            <InfoPopover label="87 countries" panelLabel="Map of the countries Dev has visited" width={500}>
              <Image
                className={popoverStyles.map}
                src="/visited-countries-map.svg"
                alt="World map with the countries Dev has visited filled in blue"
                width={1012}
                height={513}
              />
            </InfoPopover>{" "}
            so far.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { HomeContactArea } from "@/components/GithubActivityModal";
import type { GithubActivityData } from "@/lib/githubActivity";
import { Split } from "./Split";
import { useLetterPhysics } from "./useLetterPhysics";
import pageStyles from "@/app/test/test.module.css";
import styles from "./HomeHero.module.css";

export function HomeHero({ activity }: { activity: GithubActivityData }) {
  const arenaRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const blocks = useMemo(() => [portraitRef, contactsRef], []);

  const { touched, reset } = useLetterPhysics({ arena: arenaRef, word: headingRef, blocks });

  return (
    <section
      ref={arenaRef}
      className={`${pageStyles.hero} ${pageStyles.homeHero}`}
      aria-labelledby="home-introduction"
    >
      <div className={pageStyles.intro}>
        <Image
          ref={portraitRef}
          className={`${pageStyles.portrait} ${pageStyles.homePortrait}`}
          src="/icon.png"
          alt="Dev Sanghavi"
          width={210}
          height={210}
          priority
        />

        <h1
          id="home-introduction"
          ref={headingRef}
          className={`${pageStyles.copy} ${pageStyles.homeCopy}`}
          aria-label="I'm Dev Sanghavi, the founder of Learnr."
        >
          <span>
            <Split text="I'm" />{" "}
            <em className={pageStyles.blue}>
              <Split text="Dev Sanghavi" />
            </em>
            <Split text="," />
          </span>
          <span>
            <Split text="the" />{" "}
            <em>
              <Split text="founder" />
            </em>{" "}
            <Split text="of" />{" "}
            <a
              className={`${pageStyles.learnrLink} ${styles.learnr}`}
              href="https://getlearnr.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Learnr"
            >
              <em className={pageStyles.blue}>
                <Split text="Learnr" />
              </em>
            </a>
            <Split text="." />
          </span>
        </h1>

        <div ref={contactsRef} className={styles.contacts}>
          <HomeContactArea activity={activity} />
        </div>
      </div>

      {touched ? (
        <button type="button" className={styles.reset} onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Reset letters
        </button>
      ) : null}
    </section>
  );
}

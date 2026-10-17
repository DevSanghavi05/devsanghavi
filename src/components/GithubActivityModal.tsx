"use client";

import { useEffect, useRef, useState } from "react";
import { Github, Mail, Phone, X } from "lucide-react";
import type { GithubActivityData } from "@/lib/githubActivity";
import styles from "@/app/test/test.module.css";

const EMAIL = "dev@getlearnr.com";
/** How long to wait for a mail app to take focus before assuming the mailto: went nowhere. */
const MAIL_APP_WAIT_MS = 1500;

export function HomeContactArea({ activity }: { activity: GithubActivityData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailNote, setEmailNote] = useState<"copied" | "show" | null>(null);
  const mailWatch = useRef<(() => void) | null>(null);

  useEffect(() => () => mailWatch.current?.(), []);

  /**
   * A mailto: link silently does nothing when the browser has no mail app or web handler. Let the
   * native link run, and if the page never loses focus, fall back to showing (and copying) the address.
   */
  const onEmailClick = () => {
    mailWatch.current?.();
    setEmailNote(null);

    let handedOff = false;
    const leave = () => {
      handedOff = true;
    };
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", leave);

    const timer = window.setTimeout(() => {
      stop();
      if (handedOff || document.hidden) return;
      setEmailNote("show");
      navigator.clipboard?.writeText(EMAIL).then(() => setEmailNote("copied"), () => {});
    }, MAIL_APP_WAIT_MS);

    function stop() {
      window.clearTimeout(timer);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", leave);
      mailWatch.current = null;
    }
    mailWatch.current = stop;
  };

  if (!isOpen) {
    return (
      <ul className={`${styles.contacts} ${styles.homeContacts}`} aria-label="Contact links">
        <li>
          <a className={styles.homeContact} href="tel:+17133633348" aria-label="Call Dev Sanghavi">
            <Phone aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            className={styles.homeContact}
            href={`mailto:${EMAIL}`}
            aria-label={`Email Dev Sanghavi at ${EMAIL}`}
            title={EMAIL}
            onClick={onEmailClick}
          >
            <Mail aria-hidden="true" />
          </a>
        </li>
        <li>
          <button type="button" className={styles.homeContact} onClick={() => setIsOpen(true)} aria-label="Open GitHub activity">
            <Github aria-hidden="true" />
          </button>
        </li>
        <li className={styles.emailNote} role="status">
          {emailNote === "copied" ? `No mail app opened. ${EMAIL} is copied.` : null}
          {emailNote === "show" ? `No mail app opened. Write to ${EMAIL}.` : null}
        </li>
      </ul>
    );
  }

  return (
    <section className={styles.githubInlineActivity} aria-label="GitHub activity">
      <div className={styles.githubChartWrap}>
        <button className={styles.githubInlineClose} type="button" onClick={() => setIsOpen(false)} aria-label="Close GitHub activity">
          <X aria-hidden="true" />
        </button>
        <div className={styles.githubActivityCard}>
          <span className={styles.githubGrid} aria-hidden="true">
            {activity.levels.map((level, index) => (
              <span className={`${styles.githubCell} ${styles[`githubLevel${level}`]}`} key={index} />
            ))}
          </span>
        </div>
      </div>
      <div className={styles.githubInlineFooter}>
        <a href="https://github.com/DevSanghavi05" target="_blank" rel="noopener noreferrer">
          github.com/DevSanghavi05
        </a>
        <p className={styles.githubContributionTotal}>
          {activity.total.toLocaleString()} contributions in the last year
        </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { TestNav } from "../TestNav";
import { getDuolingoStreak } from "@/lib/duolingo";
import { getLearnrApp } from "@/lib/learnrApp";
import { AboutContent } from "./AboutContent";
import styles from "../test.module.css";

export const metadata: Metadata = {
  title: "About Dev Sanghavi",
  description: "Learn more about Dev Sanghavi, founder of Learnr.",
  // Internal scaffolding route — keep it out of search results.
  robots: { index: false, follow: false },
};

export default async function AboutPage() {
  const [streak, learnrApp] = await Promise.all([getDuolingoStreak(), getLearnrApp()]);

  return (
    <main className={styles.page}>
      <TestNav active="about" />

      <div className={styles.frame}>
        <section className={styles.aboutSection} aria-labelledby="about-heading">
          <AboutContent streak={streak} learnrApp={learnrApp} />
        </section>
      </div>
    </main>
  );
}

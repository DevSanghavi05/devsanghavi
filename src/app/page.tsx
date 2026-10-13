import type { Metadata } from "next";
import { ElasticFrame } from "@/components/ElasticFrame";
import { PongGame } from "@/components/PongGame";
import { HomeHero } from "@/components/home/HomeHero";
import { getGithubActivity } from "@/lib/githubActivity";
import { TestNav } from "./test/TestNav";
import styles from "./test/test.module.css";
import { DEFAULT_TITLE, PERSON } from "@/lib/seo";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: PERSON.tagline,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const githubActivity = await getGithubActivity();

  return (
    <main className={styles.page}>
      <TestNav active="home" />

      <ElasticFrame className={`${styles.frame} ${styles.homeFrame}`}>
        <HomeHero activity={githubActivity} />
      </ElasticFrame>
      <PongGame />
    </main>
  );
}

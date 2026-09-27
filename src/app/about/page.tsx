import type { Metadata } from "next";
import { TestNav } from "../test/TestNav";
import { AboutContent } from "../test/about/AboutContent";
import { PongGame } from "@/components/PongGame";
import styles from "../test/test.module.css";
import { SITE_URL, PERSON, ORG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: PERSON.bio,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Dev Sanghavi",
    description: PERSON.bio,
    url: `${SITE_URL}/about`,
    type: "profile",
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${SITE_URL}/about`,
  mainEntity: {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PERSON.name,
    description: PERSON.bio,
    jobTitle: PERSON.jobTitle,
    worksFor: { "@type": "Organization", name: ORG.name, url: ORG.url },
  },
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <TestNav active="about" />

      <div className={`${styles.frame} ${styles.aboutFrame}`}>
        <section className={styles.aboutSection} aria-labelledby="about-heading">
          <AboutContent />
        </section>
      </div>
      <PongGame />
    </main>
  );
}

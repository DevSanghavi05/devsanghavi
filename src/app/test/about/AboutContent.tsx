import Image from "next/image";
import { InfoPopover } from "@/components/InfoPopover";
import popoverStyles from "@/components/InfoPopover.module.css";
import styles from "../test.module.css";

const LANGUAGES = [
  { name: "Gujarati", flag: "/flags/in.svg", country: "India" },
  { name: "English", flag: "/flags/us.svg", country: "the United States" },
  { name: "Spanish", flag: "/flags/es.svg", country: "Spain" },
];

export function AboutContent() {
  return (
    <>
      <h1 id="about-heading" className={styles.aboutTitle}>About</h1>
      <div className={styles.aboutGrid}>
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
            <a href="https://getlearnr.com" target="_blank" rel="noopener noreferrer">
              Learnr
            </a>
            , a platform that turns any prompt into a full, personalized course.
            We launched the iOS app and just hit 500 daily active users.
          </p>
          <p>
            Outside of building, I love learning languages, with a 1000+ day
            Duolingo streak. I&apos;m fluent in{" "}
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

    </>
  );
}

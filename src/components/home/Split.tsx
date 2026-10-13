import styles from "./HomeHero.module.css";

/** Splits text into words of single-character spans; spaces stay as plain text so lines wrap between words. */
export function Split({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((chunk, index) =>
        chunk === "" || /^\s+$/.test(chunk) ? (
          chunk
        ) : (
          <span key={index} className={styles.word} aria-hidden="true">
            {[...chunk].map((character, i) => (
              <span key={i} className={styles.letter} data-letter>
                {character}
              </span>
            ))}
          </span>
        ),
      )}
    </>
  );
}

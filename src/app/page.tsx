import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <section className={styles.imageHero}>
          <Image
            src={"/Men%27s%20Accessories%20Flat%20Lay.png"}
            alt={"Clean flat-lay of men's accessories"}
            fill
            priority
            className={styles.imageHeroImg}
          />
          <div className={styles.imageHeroOverlay} />
          <div className={styles.imageHeroContent}>
            <h1 className={styles.heroTitle}>Kevin Cauto</h1>
            <p className={styles.heroTagline}>AI‑Focused Software Engineer</p>
            <div className={styles.heroButtons}>
              <a href="#projects" className={styles.primaryCta}>View Projects</a>
            </div>
          </div>
          <a href="#projects" aria-label="Scroll to projects" className={styles.scrollCue} />
        </section>
        <section className={styles.showcase} id="projects">
          <div className={styles.showcaseInner}>
          <div className={styles.spotlightHeader}>
            <div>
              <h2 className={styles.showcaseTitle}>Sweet Potato Tattoo</h2>
              <p className={styles.showcaseSubtitle}>
                A polished studio site with a rich gallery, streamlined booking, and a creator-friendly admin.
              </p>
            </div>
            <div className={styles.spotlightCtas}>
              <a
                href="https://sweetpotatotattoo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.visitButton}
              >
                Visit site →
              </a>
            </div>
          </div>

          <div className={styles.stackBadges}>
            <span className={styles.badge}>Next.js</span>
            <span className={styles.badge}>TypeScript</span>
            <span className={styles.badge}>React</span>
            <span className={styles.badge}>CSS Modules</span>
            <span className={styles.badge}>Supabase (Auth, Storage, DB)</span>
            <span className={styles.badge}>Postgres</span>
            <span className={styles.badge}>Vercel</span>
          </div>

          {/* Visual hero featuring Sweet Potato Tattoo screenshot */}
          <div className={styles.visualHero}>
            <Image
              src={"/screenshot-homepage.png"}
              alt={"Sweet Potato Tattoo — site screenshot"}
              fill
              className={styles.visualImg}
              priority
            />
            <div className={styles.visualOverlay} />
            <div className={styles.visualCaption}>
              Sweet Potato Tattoo — gallery-rich brand brought to life with a modern, editorial UI.
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={`${styles.caseHero} ${styles.glass}`}>
              <div className={styles.caseHeroInner}>
                <div className={styles.heroPills}>
                  <span className={styles.pill}>Gallery</span>
                  <span className={styles.pill}>Admin</span>
                  <span className={styles.pill}>Booking</span>
                  <span className={styles.pill}>Consent</span>
                </div>
                <h3 className={styles.caseHeadline}>Built for artists, optimized for clients.</h3>
                <p className={styles.caseLead}>Fast, responsive, and easy to update. Drag-and-drop ordering, secure uploads, and smooth intake.</p>
                <div className={styles.spotlightCtas}>
                  <a
                    href="https://sweetpotatotattoo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryCta}
                  >
                    Explore live site
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🖼️</span>
                <div>
                  <h4>Gallery of Tattoos</h4>
                  <p>Responsive gallery with categories and lazy-loading for smooth browsing.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🛠️</span>
                <div>
                  <h4>Admin Backend</h4>
                  <p>Upload, delete, and drag-and-drop reorder. Authenticated and permissioned.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📧</span>
                <div>
                  <h4>Email Capture</h4>
                  <p>Collects emails for flash drops and announcements with double opt-in.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📅</span>
                <div>
                  <h4>Booking & Availability</h4>
                  <p>Intake and scheduling pipeline to streamline requests and workload.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✍️</span>
                <div>
                  <h4>Embedded Consent</h4>
                  <p>Digital consent flow reduces paperwork and centralizes records.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.screenRail}>
            {[
              { label: 'Home', url: 'sweetpotatotattoo.com', img: '/screenshot-homepage.png' },
              { label: 'Gallery', url: '…/gallery' },
              { label: 'Admin', url: '…/admin' },
              { label: 'Booking', url: '…/booking' },
              { label: 'Consent', url: '…/consent' },
            ].map((screen) => (
              <div key={screen.label} className={styles.screenCard}>
                <div className={styles.browserChrome}>
                  <div className={styles.chromeDots}>
                    <span className={`${styles.chromeDot} ${styles.dotRed}`} />
                    <span className={`${styles.chromeDot} ${styles.dotYellow}`} />
                    <span className={`${styles.chromeDot} ${styles.dotGreen}`} />
                  </div>
                  <div className={styles.urlBar}>{screen.url}</div>
                </div>
                <div className={styles.surface} aria-label={`${screen.label} preview`}>
                  {screen.img ? (
                    <>
                      <Image
                        src={screen.img}
                        alt={`${screen.label} preview`}
                        fill
                        className={styles.screenImg}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                      <div className={styles.surfaceBadge}>{screen.label}</div>
                    </>
                  ) : (
                    screen.label
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>
      </main>
    </>
  );
}

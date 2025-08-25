import styles from "./page.module.css";
import Image from "next/image";
import GitHubContributions from "@/components/GitHubContributions";

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
            <div className={styles.heroTop}>
              <h1 className={styles.heroTitle}>Kevin Cauto</h1>
              <p className={styles.heroTagline}>AI Enthusiast • Software Engineer</p>
            </div>
            <div className={styles.heroCenter}>
              <div className={styles.heroButtons}>
                <a href="#projects" className={styles.primaryCta}>View Projects</a>
              </div>
            </div>
          </div>
          <a href="#projects" aria-label="Scroll to projects" className={styles.scrollCue} />
        </section>
        <section className={styles.showcase} id="projects">
          <div className={styles.showcaseInner}>
          <div className={styles.spotlightHeader}>
            <div>
              <h2 className={styles.showcaseTitle}>SweetPotatoTattoo.com</h2>
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
              <span className={styles.badge}>Next.js 15</span>
              <span className={styles.badge}>React 19</span>
              <span className={styles.badge}>TypeScript</span>
              <span className={styles.badge}>Tailwind CSS 4</span>
              <span className={styles.badge}>@vercel/kv</span>
              <span className={styles.badge}>@vercel/blob</span>
              <span className={styles.badge}>Resend</span>
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
              SweetPotatoTattoo.com - gallery-rich brand brought to life with a modern, editorial UI.
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
                <h3 className={styles.caseHeadline}>A fast, responsive, gallery site with a focus on lead capture and booking
                </h3>
                <p className={styles.caseLead}>The site is built with Next.js 15, React 19, TypeScript, Tailwind CSS 4, @vercel/kv for data storage, @vercel/blob for file storage, and Resend for email notifications.
                  It pulls the user in with a beautiful gallery of tattoos while still focusing on lead capture and booking. Some of
                  the features include: a full gallery to highlight the artist&apos;s work, a filterable design page to showcase the bookable flash, 
                  an admin backend to manage the site, email capture to collect emails for follow-up and marketing, and 
                  a booking & availability system to streamline requests and workload.
                </p>
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
                <span className={styles.featureIcon}>🎯</span>
                <div>
                  <h4>Filterable Design Page</h4>
                  <p>Filter and explore flash designs by theme and size for faster client discovery.</p>
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
              { label: 'Gallery', url: 'sweetpotatotattoo.com', img: '/screenshot-gallery.png' },
              { label: 'Available Flash', url: '…/available-flash', img: '/screenshot-flash.png' },
              { label: 'Consent Form', url: '…/consent-form', img: '/screenshot-consent-form.png' },
              { label: 'Booking', url: '…/booking', img: '/screenshot-booking.png' },
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

        {/* Lease Generator Section */}
        <section className={styles.showcase}>
          <div className={styles.showcaseInner}>
            <div className={styles.spotlightHeader}>
              <div>
                <h2 className={styles.showcaseTitle}>Rental Real Estate Lease Generator</h2>
                <p className={styles.showcaseSubtitle}>
                  Automated lease document generation with customizable terms and professional formatting.
                </p>
              </div>
              <div className={styles.spotlightCtas}>
                <a
                  href="/lease-editor"
                  className={styles.visitButton}
                >
                  Try it →
                </a>
              </div>
            </div>

            <div className={styles.stackBadges}>
              <span className={styles.badge}>Next.js</span>
              <span className={styles.badge}>React</span>
              <span className={styles.badge}>TypeScript</span>
              <span className={styles.badge}>docx</span>
              <span className={styles.badge}>File-Saver</span>
            </div>

            <div className={styles.contentGrid}>
              <div className={`${styles.caseHero} ${styles.glass}`}>
                <div className={styles.caseHeroInner}>
                  <div className={styles.heroPills}>
                    <span className={styles.pill}>Document Generation</span>
                    <span className={styles.pill}>Customizable</span>
                    <span className={styles.pill}>Professional</span>
                    <span className={styles.pill}>PDF Ready</span>
                  </div>
                  <h3 className={styles.caseHeadline}>Custom lease generation for my own rental business use.</h3>
                  <p className={styles.caseLead}>
                    I wanted a customized solution that allowed me to generate very specific leases tailored to my 
                    own co-living rental properties. 
                    The features include customizable property details, tenant information, lease terms, and amenities. 
                    It generates properly formatted Word documents that can be easily converted to PDF for legal use.
                    I use this tool every time I sign a new lease for my properties.
                    It&apos;s built with Next.js, React, TypeScript, and the docx library for professional document generation. 
                  </p>
                  <div className={styles.spotlightCtas}>
                    <a
                      href="/lease-editor"
                      className={styles.primaryCta}
                    >
                      Generate lease
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📄</span>
                  <div>
                    <h4>Document Generation</h4>
                    <p>Creates professional Word documents with proper formatting and legal structure.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>⚙️</span>
                  <div>
                    <h4>Customizable Fields</h4>
                    <p>Property details, tenant info, lease terms, and amenities all configurable.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🏠</span>
                  <div>
                    <h4>Property Management</h4>
                    <p>Handles each one of my properties with pre-configured addresses and details.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📅</span>
                  <div>
                    <h4>Date Handling</h4>
                    <p>Automatic date calculations, prorated rent, and lease term management.</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>💾</span>
                  <div>
                    <h4>File Export</h4>
                    <p>Direct download of generated documents ready for printing or digital use.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.screenRail}>
              {[
                { label: 'Rental Real Estate Lease Generator', url: 'lease-editor', img: '/screenshot-lease-generator.png' },
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

        {/* Coursework Section */}
        <section className={styles.showcase}>
          <div className={styles.showcaseInner}>
            <div className={styles.spotlightHeader}>
              <div>
                <h2 className={styles.showcaseTitle}>Recent Coursework</h2>
                <p className={styles.showcaseSubtitle}>
                  Continuous learning in AI engineering and software development.
                </p>
              </div>
            </div>

            <div className={styles.courseworkGrid}>
              <div className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <span className={styles.courseBadge}>Completed 2025</span>
                  <h3 className={styles.courseTitle}>The Complete Agentic AI Engineering Course</h3>
                  <p className={styles.courseInstructor}>Created by Ed Donner</p>
                </div>
                <p className={styles.courseDescription}>
                  Master AI Agents in 30 days: build 8 real-world projects with OpenAI Agents SDK, CrewAI, LangGraph, AutoGen and MCP.
                </p>
                <div className={styles.courseTech}>
                  <span className={styles.techTag}>OpenAI Agents SDK</span>
                  <span className={styles.techTag}>CrewAI</span>
                  <span className={styles.techTag}>LangGraph</span>
                  <span className={styles.techTag}>AutoGen</span>
                  <span className={styles.techTag}>MCP</span>
                </div>
                <div className={styles.courseStatus}>
                  <span className={styles.statusBadge}>Bestseller</span>
                  <span className={styles.statusBadge}>8 Projects</span>
                </div>
              </div>
              
              <div className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <span className={styles.courseBadge}>Completed 2024</span>
                  <h3 className={styles.courseTitle}>Node with React: Fullstack Web Development</h3>
                  <p className={styles.courseInstructor}>Created by Stephen Grider</p>
                </div>
                <p className={styles.courseDescription}>
                  Build and deploy fullstack web apps with NodeJS, React, Redux, Express, and MongoDB. Master deployment techniques, OAuth authentication, email processing, and credit card payments.
                </p>
                <div className={styles.courseTech}>
                  <span className={styles.techTag}>NodeJS</span>
                  <span className={styles.techTag}>React</span>
                  <span className={styles.techTag}>Redux</span>
                  <span className={styles.techTag}>Express</span>
                  <span className={styles.techTag}>MongoDB</span>
                  <span className={styles.techTag}>OAuth</span>
                  <span className={styles.techTag}>Stripe</span>
                </div>
                <div className={styles.courseStatus}>
                  <span className={styles.statusBadge}>Fullstack</span>
                  <span className={styles.statusBadge}>Production Ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <a href="https://github.com/kevincauto" target="_blank" rel="noopener noreferrer" className={styles.contributionLink}>
          <GitHubContributions />
        </a>
      </main>
    </>
  );
}

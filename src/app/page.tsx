"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { LANG, type Lang } from "@/lib/i18n";
import KanjiRain from "@/components/KanjiRain";
import BookingSection from "@/components/BookingSection";

const LOCATION_ICONS = ["📍", "📍", "📍", "📍", "📍"];

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");
  const t = LANG[lang];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );
    document
      .querySelectorAll("section[id]")
      .forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navItems = [
    { id: "hero", label: t.nav.home },
    { id: "about", label: t.nav.about },
    { id: "pricing", label: t.nav.pricing },
    { id: "locations", label: t.nav.locations },
    { id: "book", label: t.nav.book },
  ];

  return (
    <>
      <div className="grain-overlay" />

      {/* ═══════ NAV ═══════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 70,
          padding: "0 40px",
          background: scrollY > 60 ? "rgba(10,10,10,0.92)" : "transparent",
          backdropFilter: scrollY > 60 ? "blur(20px)" : "none",
          borderBottom:
            scrollY > 60 ? "1px solid rgba(56,189,248,0.1)" : "none",
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
          onClick={() => scrollTo("hero")}
        >
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            style={{ borderRadius: "50%", objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              letterSpacing: 3,
            }}
          >
            HIROKI TAKAYA
          </span>
        </div>

        <div
          className="desktop-nav"
          style={{ display: "flex", alignItems: "center", gap: 32 }}
        >
          {navItems.map((item) => (
            <span
              key={item.id}
              className={`nav-link ${activeSection === item.id ? "active" : ""}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </span>
          ))}
          <button
            onClick={() => setLang(lang === "en" ? "ja" : "en")}
            style={{
              background: "none",
              border: "1px solid rgba(56,189,248,0.3)",
              color: "var(--color-accent)",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 13,
              letterSpacing: 1,
              fontFamily: "var(--font-jp)",
              transition: "all 0.3s ease",
            }}
          >
            {lang === "en" ? "日本語" : "EN"}
          </button>
        </div>

        {/* Mobile toggle */}
        <div
          className="mobile-toggle"
          style={{
            display: "none",
            flexDirection: "column",
            gap: 5,
            cursor: "pointer",
          }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            style={{
              width: 24,
              height: 2,
              background: "var(--color-accent)",
              transition: "all 0.3s",
              transform: menuOpen
                ? "rotate(45deg) translate(5px, 5px)"
                : "none",
            }}
          />
          <span
            style={{
              width: 24,
              height: 2,
              background: "var(--color-accent)",
              transition: "all 0.3s",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              width: 24,
              height: 2,
              background: "var(--color-accent)",
              transition: "all 0.3s",
              transform: menuOpen
                ? "rotate(-45deg) translate(5px, -5px)"
                : "none",
            }}
          />
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "rgba(10,10,10,0.97)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
          }}
        >
          {navItems.map((item) => (
            <span
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                fontSize: 24,
                fontFamily: "var(--font-display)",
                letterSpacing: 4,
                cursor: "pointer",
                color:
                  activeSection === item.id
                    ? "var(--color-accent)"
                    : "var(--color-text)",
              }}
            >
              {item.label}
            </span>
          ))}
          <button
            onClick={() => {
              setLang(lang === "en" ? "ja" : "en");
              setMenuOpen(false);
            }}
            style={{
              background: "none",
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 16,
              fontFamily: "var(--font-jp)",
            }}
          >
            {lang === "en" ? "日本語" : "EN"}
          </button>
        </div>
      )}

      {/* ═══════ HERO ═══════ */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <KanjiRain />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(56,189,248,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(8,145,178,0.06) 0%, transparent 50%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
            padding: "0 24px",
            maxWidth: 1100,
            width: "100%",
            flexWrap: "wrap",
            transform: `translateY(${scrollY * 0.15}px)`,
            opacity: Math.max(0, 1 - scrollY / 600),
          }}
        >
          {/* Left – copy */}
          <div style={{ textAlign: "left", maxWidth: 520, flex: "1 1 320px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                letterSpacing: 6,
                color: "var(--color-accent)",
                marginBottom: 24,
                animation: "fadeUp 0.8s ease forwards",
              }}
            >
              {t.hero.subtitle}
            </p>

            <h1
              style={{
                fontFamily: "var(--font-jp)",
                fontWeight: 900,
                fontSize: "clamp(36px, 6vw, 68px)",
                lineHeight: 1.1,
                margin: "0 0 24px",
                background:
                  "linear-gradient(135deg, #e8e4df 0%, #38bdf8 50%, #e8e4df 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "fadeUp 0.8s 0.2s ease both",
              }}
            >
              {t.hero.title}
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.7,
                color: "var(--color-text-muted)",
                maxWidth: 460,
                margin: "0 0 48px",
                animation: "fadeUp 0.8s 0.4s ease both",
              }}
            >
              {t.hero.desc}
            </p>

            <button
              className="btn-primary"
              onClick={() => scrollTo("book")}
              style={{ animation: "fadeUp 0.8s 0.6s ease both" }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>
                {t.hero.cta}
              </span>
            </button>
          </div>

          {/* Right – photo */}
          <div
            style={{
              flex: "0 1 340px",
              position: "relative",
              animation: "fadeUp 1s 0.4s ease both",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -8,
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.15), transparent 60%)",
                filter: "blur(30px)",
              }}
            />
            <Image
              src="/images/hiroki-portrait.jpg"
              alt="Hiroki Takaya"
              width={340}
              height={400}
              priority
              style={{
                width: "100%",
                maxWidth: 340,
                height: 400,
                objectFit: "cover",
                objectPosition: "top",
                position: "relative",
                border: "1px solid rgba(56,189,248,0.15)",
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--color-text-faintest)",
            }}
          >
            {t.hero.scroll}
          </p>
          <div
            style={{
              width: 1,
              height: 40,
              background:
                "linear-gradient(to bottom, rgba(56,189,248,0.5), transparent)",
            }}
          />
        </div>
      </section>

      {/* ═══════ ABOUT ═══════ */}
      <section id="about" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              letterSpacing: 5,
              color: "var(--color-accent)",
              marginBottom: 16,
            }}
          >
            {t.about.tag}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 32,
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={72}
              height={72}
              style={{
                borderRadius: "50%",
                objectFit: "contain",
                border: "1px solid rgba(56,189,248,0.15)",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-jp)",
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 52px)",
                lineHeight: 1.2,
              }}
            >
              {t.about.title}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: 24,
              marginBottom: 60,
            }}
          >
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--color-text-muted)" }}>
              {t.about.p1}
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--color-text-muted)" }}>
              {t.about.p2}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 24,
            }}
          >
            {t.about.stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 20px",
                  textAlign: "center",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 32,
                    color: "var(--color-accent)",
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "var(--color-text-faint)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider">
        <div />
      </div>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                letterSpacing: 5,
                color: "var(--color-accent)",
                marginBottom: 16,
              }}
            >
              {t.pricing.tag}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-jp)",
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 48px)",
                marginBottom: 16,
              }}
            >
              {t.pricing.title}
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "var(--color-text-faint)",
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              {t.pricing.subtitle}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              alignItems: "start",
            }}
          >
            {t.pricing.plans.map((plan, i) => (
              <div
                key={i}
                className="price-card"
                style={{
                  padding: "40px 32px",
                  background: plan.highlight
                    ? "linear-gradient(160deg, rgba(56,189,248,0.08), rgba(56,189,248,0.02))"
                    : "var(--color-surface)",
                  border: plan.highlight
                    ? "1px solid rgba(56,189,248,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(to right, transparent, var(--color-accent), transparent)",
                    }}
                  />
                )}
                <h3
                  style={{
                    fontWeight: 500,
                    fontSize: 16,
                    marginBottom: 20,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {plan.name}
                </h3>
                <div style={{ marginBottom: 28 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 56,
                      color: plan.highlight
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      color: "var(--color-text-faintest)",
                      marginLeft: 4,
                    }}
                  >
                    {plan.per}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {plan.features.map((f, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{ color: "var(--color-accent)", fontSize: 14 }}
                      >
                        ✦
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--color-text-faint)",
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => scrollTo("book")}
                  style={{
                    width: "100%",
                    marginTop: 32,
                    background: plan.highlight
                      ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))"
                      : "transparent",
                    border: plan.highlight
                      ? "none"
                      : "1px solid rgba(56,189,248,0.3)",
                    color: plan.highlight ? "#ffffff" : "var(--color-accent)",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {t.nav.book}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider">
        <div />
      </div>

      {/* ═══════ LOCATIONS ═══════ */}
      <section id="locations" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              letterSpacing: 5,
              color: "var(--color-accent)",
              marginBottom: 16,
            }}
          >
            {t.locations.tag}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-jp)",
              fontWeight: 900,
              fontSize: "clamp(32px, 5vw, 48px)",
              marginBottom: 48,
            }}
          >
            {t.locations.title}
          </h2>

          <div style={{ display: "grid", gap: 20 }}>
            {t.locations.spots.map((spot, i) => (
              <div
                key={i}
                className="location-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 24,
                  alignItems: "center",
                  padding: 32,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "rgba(56,189,248,0.08)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    color: "var(--color-accent)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 14,
                      letterSpacing: 3,
                      color: "var(--color-accent)",
                      marginBottom: 4,
                    }}
                  >
                    {spot.area}
                  </p>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {spot.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-faint)",
                    }}
                  >
                    {spot.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider">
        <div />
      </div>


      {/* ═══════ BOOKING ═══════ */}
      <BookingSection lang={lang} />


      {/* ═══════ FOOTER ═══════ */}
      <footer
        style={{
          padding: "48px 24px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-text-faintest)" }}>
            {t.footer.copy}
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <a
              href="https://www.instagram.com/japaneseflash/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: "var(--color-text-faintest)",
                textDecoration: "none",
              }}
            >
              {t.footer.links[0]}
            </a>
            <a
              href="https://hirokijiujitsu.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: "var(--color-text-faintest)",
                textDecoration: "none",
              }}
            >
              {t.footer.links[1]}
            </a>
            <span
              onClick={() => scrollTo("book")}
              style={{
                fontSize: 13,
                color: "var(--color-text-faintest)",
                cursor: "pointer",
              }}
            >
              {t.footer.links[2]}
            </span>
            <a
              href="/admin"
              style={{
                fontSize: 11,
                color: "rgba(232,228,223,0.15)",
                textDecoration: "none",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(232,228,223,0.15)")}
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
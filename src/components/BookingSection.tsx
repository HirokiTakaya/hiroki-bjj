"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAvailability,
  createBooking,
  type DayAvailability,
} from "@/lib/firestore-client";

type Lang = "en" | "ja";

const LABELS = {
  en: {
    tag: "BOOK NOW",
    title: "Reserve Your Session",
    selectDate: "Select a Date",
    availableSlots: "Available Times",
    selectLocation: "Select Location",
    yourInfo: "Your Information",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number (optional)",
    experience: "Experience Level",
    expOptions: [
      "Complete Beginner",
      "< 1 Year",
      "1-3 Years",
      "3+ Years / Competitor",
    ],
    message: "Goals or Notes",
    messagePlaceholder:
      "Tell me about your goals, injuries, or anything I should know...",
    confirm: "Confirm Booking",
    booking: "Booking...",
    success: "Booking Confirmed! See you on the mats. OSS! 🤙",
    successDetail: "You'll receive a confirmation at",
    error: "This slot was just booked. Please choose another time.",
    genericError: "Something went wrong. Please try again.",
    noAvailability: "No availability right now.",
    back: "← Back",
    loading: "Loading availability...",
    monthNames: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    hint: "Highlighted dates have available slots",
    oneHour: "1 HOUR",
    multipleLocations: "locations",
  },
  ja: {
    tag: "予約",
    title: "セッションを予約する",
    selectDate: "日付を選択",
    availableSlots: "空き時間",
    selectLocation: "場所を選択",
    yourInfo: "お客様情報",
    name: "お名前",
    email: "メールアドレス",
    phone: "電話番号（任意）",
    experience: "経験レベル",
    expOptions: ["完全初心者", "1年未満", "1〜3年", "3年以上 / 競技者"],
    message: "目標・備考",
    messagePlaceholder:
      "目標、怪我、その他知っておくべきことを教えてください...",
    confirm: "予約を確定",
    booking: "予約中...",
    success: "予約確定！マットでお会いしましょう。OSS! 🤙",
    successDetail: "確認メールを送信します：",
    error: "このスロットは予約済みです。別の時間を選択してください。",
    genericError: "エラーが発生しました。もう一度お試しください。",
    noAvailability: "現在、予約可能な枠がありません。",
    back: "← 戻る",
    loading: "空き状況を読み込み中...",
    monthNames: [
      "1月", "2月", "3月", "4月", "5月", "6月",
      "7月", "8月", "9月", "10月", "11月", "12月",
    ],
    dayNames: ["日", "月", "火", "水", "木", "金", "土"],
    hint: "ハイライトされた日付に空きがあります",
    oneHour: "1 HOUR",
    multipleLocations: "箇所",
  },
};

function formatDate(dateStr: string, lang: Lang) {
  const d = new Date(`${dateStr}T00:00:00`);
  const month = LABELS[lang].monthNames[d.getMonth()];
  const day = d.getDate();
  const weekday = LABELS[lang].dayNames[d.getDay()];
  return lang === "en"
    ? `${weekday}, ${month} ${day}`
    : `${month}${day}日 (${weekday})`;
}

export default function BookingSection({ lang }: { lang: Lang }) {
  const t = LABELS[lang];

  const [slots, setSlots] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const [step, setStep] = useState<
    "date" | "time" | "location" | "form" | "done"
  >("date");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    message: "",
  });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailability();
      setSlots(data);
    } catch (err) {
      console.error("Availability fetch error:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const availableDates = useMemo(() => {
    return new Set(slots.map((s) => s.date));
  }, [slots]);

  const selectedDaySlot = useMemo(() => {
    return slots.find((s) => s.date === selectedDate) ?? null;
  }, [slots, selectedDate]);

  const selectedTimeSlot = useMemo(() => {
    return (
      selectedDaySlot?.timeSlots.find((ts) => ts.time === selectedTime) ?? null
    );
  }, [selectedDaySlot, selectedTime]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedLocation(null);
    setStep("time");
    setError(null);
  };

  const handleSelectTime = (time: string, locations: string[]) => {
    setSelectedTime(time);
    setSelectedLocation(null);
    setError(null);

    if (locations.length === 1) {
      setSelectedLocation(locations[0]);
      setStep("form");
    } else {
      setStep("location");
    }
  };

  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setStep("form");
    setError(null);
  };

  const handleBack = () => {
    if (
      step === "form" &&
      selectedTimeSlot &&
      selectedTimeSlot.locations.length > 1
    ) {
      setStep("location");
      setSelectedLocation(null);
    } else if (step === "form" || step === "location") {
      setStep("time");
      setSelectedTime(null);
      setSelectedLocation(null);
    } else if (step === "time") {
      setStep("date");
      setSelectedDate(null);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedLocation) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createBooking({
        date: selectedDate,
        time: selectedTime,
        location: selectedLocation,
        ...formData,
      });

      if (result.success) {
        setStep("done");

        // Send email notification (non-blocking)
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            time: selectedTime,
            location: selectedLocation,
            ...formData,
          }),
        }).catch((err) => console.error("Notification error:", err));

        await loadAvailability();
      } else {
        setError(
          result.error === "Slot already booked" ? t.error : result.error
        );
        await loadAvailability();
      }
    } catch (err) {
      console.error("Booking submit error:", err);
      setError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const isAvailable = availableDates.has(dateStr);
      const isPast = new Date(year, month, day) < today;
      const isSelected = selectedDate === dateStr;

      cells.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            if (isAvailable && !isPast) handleSelectDate(dateStr);
          }}
          disabled={!isAvailable || isPast}
          style={{
            width: "100%",
            aspectRatio: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            borderRadius: 4,
            transition: "all 0.2s ease",
            border: isSelected
              ? "2px solid var(--color-accent)"
              : "1px solid transparent",
            background: isSelected
              ? "rgba(56,189,248,0.15)"
              : isAvailable && !isPast
              ? "rgba(56,189,248,0.06)"
              : "transparent",
            color:
              isPast || !isAvailable
                ? "rgba(232,228,223,0.2)"
                : isSelected
                ? "var(--color-accent)"
                : "var(--color-text)",
            cursor: isAvailable && !isPast ? "pointer" : "default",
          }}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const labelStyle = {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "var(--color-text-faint)",
    marginBottom: 8,
    display: "block" as const,
  };

  const backBtn = (
    <button
      type="button"
      onClick={handleBack}
      style={{
        background: "none",
        border: "none",
        color: "var(--color-accent)",
        cursor: "pointer",
        fontSize: 14,
        marginBottom: 24,
        padding: 0,
        fontFamily: "var(--font-body)",
      }}
    >
      {t.back}
    </button>
  );

  if (loading) {
    return (
      <section id="book" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-faint)" }}>{t.loading}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="book" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            letterSpacing: 5,
            color: "var(--color-accent)",
            marginBottom: 16,
          }}
        >
          {t.tag}
        </p>
        <h2
          style={{
            fontFamily: "var(--font-jp)",
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 48px)",
            marginBottom: 48,
          }}
        >
          {t.title}
        </h2>

        {/* Done */}
        {step === "done" && (
          <div
            style={{
              padding: "48px 32px",
              textAlign: "center",
              background: "var(--color-surface-accent)",
              border: "1px solid rgba(56,189,248,0.2)",
              animation: "fadeUp 0.6s ease",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤙</div>
            <p
              style={{
                fontSize: 20,
                color: "var(--color-accent)",
                fontFamily: "var(--font-jp)",
                marginBottom: 12,
              }}
            >
              {t.success}
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-faint)" }}>
              {selectedDate && formatDate(selectedDate, lang)} · {selectedTime} ·{" "}
              {selectedLocation}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-faintest)",
                marginTop: 8,
              }}
            >
              {t.successDetail} {formData.email}
            </p>
          </div>
        )}

        {/* Date */}
        {step === "date" && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <p
              style={{
                fontSize: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: 20,
              }}
            >
              {t.selectDate}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ‹
              </button>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  letterSpacing: 2,
                }}
              >
                {t.monthNames[calendarMonth.getMonth()]}{" "}
                {calendarMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ›
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                marginBottom: 4,
              }}
            >
              {t.dayNames.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--color-text-faintest)",
                    padding: "8px 0",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {renderCalendar()}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-faintest)",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              {slots.length > 0 ? t.hint : t.noAvailability}
            </p>
          </div>
        )}

        {/* Time */}
        {step === "time" && selectedDaySlot && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            {backBtn}
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                letterSpacing: 2,
                marginBottom: 24,
              }}
            >
              {selectedDate && formatDate(selectedDate, lang)}
            </p>
            <p
              style={{
                fontSize: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: 16,
              }}
            >
              {t.availableSlots}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 12,
              }}
            >
              {selectedDaySlot.timeSlots.map((ts) => (
                <button
                  key={ts.time}
                  type="button"
                  onClick={() => handleSelectTime(ts.time, ts.locations)}
                  style={{
                    padding: "16px 8px",
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    letterSpacing: 1,
                    transition: "all 0.2s ease",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  {ts.time}
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      color: "var(--color-text-faintest)",
                      marginTop: 4,
                      fontFamily: "var(--font-body)",
                      letterSpacing: 0,
                    }}
                  >
                    {ts.locations.length === 1
                      ? ts.locations[0].split(" — ")[0]
                      : `${ts.locations.length} ${t.multipleLocations}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        {step === "location" && selectedTimeSlot && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            {backBtn}
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              {selectedDate && formatDate(selectedDate, lang)} · {selectedTime}
            </p>
            <p
              style={{
                fontSize: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: 16,
                marginTop: 24,
              }}
            >
              {t.selectLocation}
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {selectedTimeSlot.locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  style={{
                    padding: "20px 24px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: 16,
                  }}
                >
                  <span
                    style={{ color: "var(--color-accent)", marginRight: 12 }}
                  >
                    📍
                  </span>
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {step === "form" && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            {backBtn}
            <div
              style={{
                padding: "20px 24px",
                background: "rgba(56,189,248,0.05)",
                border: "1px solid var(--color-border)",
                marginBottom: 32,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    letterSpacing: 1,
                  }}
                >
                  {selectedDate && formatDate(selectedDate, lang)} ·{" "}
                  {selectedTime}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-faint)",
                    marginTop: 4,
                  }}
                >
                  {selectedLocation}
                </p>
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-display)",
                  letterSpacing: 1,
                }}
              >
                {t.oneHour}
              </span>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            <p
              style={{
                fontSize: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: 20,
              }}
            >
              {t.yourInfo}
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>{t.name}</label>
                  <input
                    className="input-field"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t.email}</label>
                  <input
                    className="input-field"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>{t.phone}</label>
                  <input
                    className="input-field"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t.experience}</label>
                  <select
                    className="input-field"
                    required
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      —
                    </option>
                    {t.expOptions.map((o, i) => (
                      <option
                        key={i}
                        value={o}
                        style={{ background: "#1a1a1a" }}
                      >
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t.message}</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder={t.messagePlaceholder}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  style={{ resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  width: "100%",
                  marginTop: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <span style={{ position: "relative", zIndex: 1 }}>
                  {submitting ? t.booking : t.confirm}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
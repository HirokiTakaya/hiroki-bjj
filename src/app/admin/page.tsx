"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchWeeklySchedule,
  saveWeeklySchedule,
  fetchBookings,
  cancelBooking,
  fetchDateOverrides,
  saveDateOverride,
  deleteDateOverride,
  type WeeklySchedule,
  type Slot,
  type Booking,
  type DateOverride,
} from "@/lib/firestore-client";

const LOCATIONS = [
  "Kitsilano — Gracie Barra",
  "Richmond — Gracie Barra",
  "Vancouver — Lions MMA",
  "North Vancouver — Samurai Spirit",
  "Burnaby — Advantage Fitness",
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function sortSlots(slots: Slot[]) {
  return [...slots].sort((a, b) => {
    const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (timeDiff !== 0) return timeDiff;
    return a.location.localeCompare(b.location);
  });
}

function getLocationsForTime(slots: Slot[], time: string): string[] {
  return [
    ...new Set(
      slots.filter((slot) => slot.time === time).map((slot) => slot.location).filter(Boolean)
    ),
  ];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]}, ${dateStr}`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<"schedule" | "overrides" | "bookings">("schedule");

  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [overrides, setOverrides] = useState<Map<string, DateOverride>>(new Map());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [selectedDay, setSelectedDay] = useState(1);

  // Date override state
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideSlots, setOverrideSlots] = useState<Slot[]>([]);
  const [overrideClosed, setOverrideClosed] = useState(false);
  const [overrideSaveMsg, setOverrideSaveMsg] = useState("");

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Invalid password");
    }
  };

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklySchedule();
      setSchedule(data);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchBookings();
      setBookingsList(data);
    } finally {
      setLoading(false);
    }
  };

  const loadOverrides = async () => {
    try {
      const data = await fetchDateOverrides();
      setOverrides(data);
    } catch (err) {
      console.error("Failed to load overrides:", err);
    }
  };

  useEffect(() => {
    if (authed) {
      loadSchedule();
      loadBookings();
      loadOverrides();
    }
  }, [authed]);

  // ─── Weekly Schedule Logic ─────────────────────────────────────────────────

  const currentDay = schedule[String(selectedDay)] || { slots: [] };

  const uniqueLocationCount = useMemo(() => {
    return new Set(currentDay.slots.map((slot) => slot.location).filter(Boolean)).size;
  }, [currentDay]);

  const toggleLocationForTime = (day: number, time: string, location: string) => {
    const key = String(day);
    const current = schedule[key] || { slots: [] };
    const exists = current.slots.some((slot) => slot.time === time && slot.location === location);

    let nextSlots: Slot[];
    if (exists) {
      nextSlots = current.slots.filter((slot) => !(slot.time === time && slot.location === location));
    } else {
      nextSlots = [...current.slots, { time, location }];
    }

    nextSlots = sortSlots(nextSlots);

    if (nextSlots.length === 0) {
      const nextSchedule = { ...schedule };
      delete nextSchedule[key];
      setSchedule(nextSchedule);
      return;
    }

    setSchedule({ ...schedule, [key]: { slots: nextSlots } });
  };

  const clearTime = (day: number, time: string) => {
    const key = String(day);
    const current = schedule[key] || { slots: [] };
    const nextSlots = current.slots.filter((slot) => slot.time !== time);

    if (nextSlots.length === 0) {
      const nextSchedule = { ...schedule };
      delete nextSchedule[key];
      setSchedule(nextSchedule);
      return;
    }

    setSchedule({ ...schedule, [key]: { slots: sortSlots(nextSlots) } });
  };

  const copyToAllDays = () => {
    const source = schedule[String(selectedDay)];
    if (!source || source.slots.length === 0) return;
    const newSchedule = { ...schedule };
    for (let d = 0; d < 7; d++) {
      if (d !== selectedDay) {
        newSchedule[String(d)] = { slots: source.slots.map((slot) => ({ ...slot })) };
      }
    }
    setSchedule(newSchedule);
  };

  const copyToWeekdays = () => {
    const source = schedule[String(selectedDay)];
    if (!source || source.slots.length === 0) return;
    const newSchedule = { ...schedule };
    for (let d = 1; d <= 5; d++) {
      if (d !== selectedDay) {
        newSchedule[String(d)] = { slots: source.slots.map((slot) => ({ ...slot })) };
      }
    }
    setSchedule(newSchedule);
  };

  const clearDay = (day: number) => {
    const newSchedule = { ...schedule };
    delete newSchedule[String(day)];
    setSchedule(newSchedule);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const cleanedSchedule: WeeklySchedule = {};
      for (const [day, data] of Object.entries(schedule)) {
        const cleanedSlots = (data.slots || [])
          .map((slot) => ({ time: slot.time.trim(), location: slot.location.trim() }))
          .filter((slot) => slot.time && slot.location);
        if (cleanedSlots.length > 0) {
          cleanedSchedule[day] = { slots: sortSlots(cleanedSlots) };
        }
      }
      await saveWeeklySchedule(cleanedSchedule);
      setSchedule(cleanedSchedule);
      setSaveMsg("✅ Saved!");
    } catch {
      setSaveMsg("❌ Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  // ─── Date Override Logic ───────────────────────────────────────────────────

  const handleSelectOverrideDate = (dateStr: string) => {
    setOverrideDate(dateStr);
    setOverrideSaveMsg("");

    const existing = overrides.get(dateStr);
    if (existing) {
      setOverrideSlots([...existing.slots]);
      setOverrideClosed(existing.closed ?? false);
    } else {
      // Pre-fill from weekly template
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      const weeklyDay = schedule[String(dayOfWeek)];
      if (weeklyDay && weeklyDay.slots.length > 0) {
        setOverrideSlots(weeklyDay.slots.map((s) => ({ ...s })));
      } else {
        setOverrideSlots([]);
      }
      setOverrideClosed(false);
    }
  };

  const toggleOverrideLocation = (time: string, location: string) => {
    const exists = overrideSlots.some((s) => s.time === time && s.location === location);
    let next: Slot[];
    if (exists) {
      next = overrideSlots.filter((s) => !(s.time === time && s.location === location));
    } else {
      next = [...overrideSlots, { time, location }];
    }
    setOverrideSlots(sortSlots(next));
  };

  const clearOverrideTime = (time: string) => {
    setOverrideSlots(overrideSlots.filter((s) => s.time !== time));
  };

  const handleSaveOverride = async () => {
    if (!overrideDate) return;
    setSaving(true);
    setOverrideSaveMsg("");
    try {
      await saveDateOverride(overrideDate, { closed: overrideClosed, slots: overrideSlots });
      await loadOverrides();
      setOverrideSaveMsg("✅ Override saved!");
    } catch {
      setOverrideSaveMsg("❌ Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setOverrideSaveMsg(""), 3000);
    }
  };

  const handleDeleteOverride = async () => {
    if (!overrideDate) return;
    if (!confirm(`Remove override for ${overrideDate}? It will revert to the weekly template.`)) return;
    try {
      await deleteDateOverride(overrideDate);
      await loadOverrides();
      setOverrideDate("");
      setOverrideSlots([]);
      setOverrideClosed(false);
      setOverrideSaveMsg("✅ Override removed");
      setTimeout(() => setOverrideSaveMsg(""), 3000);
    } catch {
      setOverrideSaveMsg("❌ Failed to remove");
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    await cancelBooking(id);
    await loadBookings();
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const s = {
    page: { background: "#0a0a0a", color: "#e8e4df", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: "40px 24px" } as React.CSSProperties,
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.1)", padding: "24px", marginBottom: 16 } as React.CSSProperties,
    h1: { fontSize: 28, fontWeight: 700, marginBottom: 32, color: "#38bdf8" } as React.CSSProperties,
    h2: { fontSize: 18, fontWeight: 600, marginBottom: 16 } as React.CSSProperties,
    input: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(56,189,248,0.15)", color: "#e8e4df", padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
    btn: { background: "linear-gradient(135deg, #38bdf8, #0891b2)", color: "#fff", border: "none", padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 600 } as React.CSSProperties,
    btnSecondary: { background: "transparent", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", padding: "8px 16px", cursor: "pointer", fontSize: 13 } as React.CSSProperties,
    btnDanger: { background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", padding: "6px 16px", cursor: "pointer", fontSize: 12 } as React.CSSProperties,
    tab: (active: boolean) => ({ background: active ? "rgba(56,189,248,0.15)" : "transparent", border: active ? "1px solid #38bdf8" : "1px solid rgba(56,189,248,0.2)", color: active ? "#38bdf8" : "#e8e4df", padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 500 }) as React.CSSProperties,
    dayTab: (active: boolean, hasSchedule: boolean) => ({ padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400, textAlign: "center" as const, background: active ? "rgba(56,189,248,0.15)" : "transparent", border: active ? "1px solid #38bdf8" : hasSchedule ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(255,255,255,0.06)", color: active ? "#38bdf8" : hasSchedule ? "#e8e4df" : "rgba(232,228,223,0.3)", transition: "all 0.2s" }) as React.CSSProperties,
    label: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase" as const, color: "rgba(232,228,223,0.5)", marginBottom: 10, display: "block" } as React.CSSProperties,
    dot: (active: boolean) => ({ width: 6, height: 6, borderRadius: "50%", background: active ? "#38bdf8" : "transparent", display: "inline-block", margin: "4px auto 0" }) as React.CSSProperties,
    chip: (active: boolean) => ({ display: "inline-block", padding: "8px 16px", margin: "0 6px 8px 0", cursor: "pointer", fontSize: 13, border: active ? "1px solid #38bdf8" : "1px solid rgba(56,189,248,0.15)", background: active ? "rgba(56,189,248,0.15)" : "transparent", color: active ? "#38bdf8" : "#e8e4df", transition: "all 0.2s" }) as React.CSSProperties,
  };

  // ─── Login ─────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...s.card, maxWidth: 400, width: "100%" }}>
          <h1 style={s.h1}>🥋 Admin</h1>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
          {authError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{authError}</p>}
          <button style={{ ...s.btn, width: "100%", marginTop: 16 }} onClick={login}>Login</button>
        </div>
      </div>
    );
  }

  // ─── Main ──────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <h1 style={{ ...s.h1, marginBottom: 0 }}>🥋 Booking Admin</h1>
          <a href="/" style={{ color: "rgba(232,228,223,0.4)", fontSize: 13, textDecoration: "none" }}>← Back to site</a>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          <button style={s.tab(tab === "schedule")} onClick={() => setTab("schedule")}>Weekly Schedule</button>
          <button style={s.tab(tab === "overrides")} onClick={() => setTab("overrides")}>Date Override</button>
          <button style={s.tab(tab === "bookings")} onClick={() => setTab("bookings")}>
            Bookings ({bookingsList.filter((b) => b.status === "confirmed").length})
          </button>
        </div>

        {/* ══ Schedule Tab ══ */}
        {tab === "schedule" && (
          <div style={s.card}>
            <p style={{ fontSize: 14, color: "rgba(232,228,223,0.5)", marginBottom: 20 }}>
              Set your weekly availability template. Use &quot;Date Override&quot; to customize specific dates.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 24 }}>
              {DAY_NAMES.map((name, i) => {
                const hasSchedule = (schedule[String(i)]?.slots?.length ?? 0) > 0;
                return (
                  <div key={i} onClick={() => setSelectedDay(i)} style={s.dayTab(selectedDay === i, hasSchedule)}>
                    <div>{name.slice(0, 3)}</div>
                    <div style={s.dot(hasSchedule)} />
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "20px 0", borderTop: "1px solid rgba(56,189,248,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ ...s.h2, marginBottom: 0 }}>{DAY_NAMES[selectedDay]}</h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={s.btnSecondary} onClick={copyToWeekdays}>Copy to weekdays</button>
                  <button style={s.btnSecondary} onClick={copyToAllDays}>Copy to all days</button>
                  <button style={s.btnDanger} onClick={() => clearDay(selectedDay)}>Clear day</button>
                </div>
              </div>

              <label style={s.label}>Time-based Location Selection</label>

              <div style={{ display: "grid", gap: 18 }}>
                {TIME_OPTIONS.map((time) => {
                  const selectedLocations = getLocationsForTime(currentDay.slots, time);
                  return (
                    <div key={time} style={{ padding: "14px 16px", border: "1px solid rgba(56,189,248,0.08)", background: selectedLocations.length > 0 ? "rgba(56,189,248,0.04)" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{time}</div>
                          <div style={{ fontSize: 12, color: "rgba(232,228,223,0.45)", marginTop: 4 }}>
                            {selectedLocations.length > 0 ? `${selectedLocations.length} selected` : "No locations selected"}
                          </div>
                        </div>
                        {selectedLocations.length > 0 && (
                          <button style={s.btnDanger} onClick={() => clearTime(selectedDay, time)}>Clear time</button>
                        )}
                      </div>
                      <div>
                        {LOCATIONS.map((location) => (
                          <span key={location} style={s.chip(selectedLocations.includes(location))} onClick={() => toggleLocationForTime(selectedDay, time, location)}>
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "16px 0", borderTop: "1px solid rgba(56,189,248,0.08)", marginTop: 8 }}>
              <label style={s.label}>Week Overview</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {DAY_NAMES.map((name, i) => {
                  const day = schedule[String(i)];
                  const slotCount = day?.slots?.length ?? 0;
                  return (
                    <div key={i} style={{ fontSize: 12, textAlign: "center", color: slotCount > 0 ? "#e8e4df" : "rgba(232,228,223,0.2)" }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{name.slice(0, 3)}</div>
                      {slotCount > 0 ? <div style={{ color: "#38bdf8" }}>{slotCount} slots</div> : <div>OFF</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
              <button style={s.btn} onClick={handleSaveSchedule} disabled={saving}>{saving ? "Saving..." : "Save Schedule"}</button>
              {saveMsg && <span style={{ fontSize: 14 }}>{saveMsg}</span>}
            </div>
          </div>
        )}

        {/* ══ Date Override Tab ══ */}
        {tab === "overrides" && (
          <div style={s.card}>
            <p style={{ fontSize: 14, color: "rgba(232,228,223,0.5)", marginBottom: 20 }}>
              Override a specific date&apos;s schedule. This takes priority over the weekly template.
            </p>

            {/* Date picker */}
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Select Date</label>
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => handleSelectOverrideDate(e.target.value)}
                style={{ ...s.input, maxWidth: 250 }}
              />
            </div>

            {/* Existing overrides list */}
            {overrides.size > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={s.label}>Existing Overrides</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.from(overrides.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateStr, ov]) => (
                      <span
                        key={dateStr}
                        onClick={() => handleSelectOverrideDate(dateStr)}
                        style={{
                          ...s.chip(overrideDate === dateStr),
                          fontSize: 12,
                          padding: "6px 12px",
                        }}
                      >
                        {formatDateLabel(dateStr)}
                        {ov.closed ? " 🚫" : ` (${ov.slots.length})`}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Edit override */}
            {overrideDate && (
              <div style={{ borderTop: "1px solid rgba(56,189,248,0.08)", paddingTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h2 style={{ ...s.h2, marginBottom: 0 }}>{formatDateLabel(overrideDate)}</h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {overrides.has(overrideDate) && (
                      <button style={s.btnDanger} onClick={handleDeleteOverride}>Remove override</button>
                    )}
                  </div>
                </div>

                {/* Closed toggle */}
                <div
                  style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => setOverrideClosed(!overrideClosed)}
                >
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, padding: 2,
                    background: overrideClosed ? "rgba(239,68,68,0.4)" : "rgba(56,189,248,0.2)",
                    transition: "background 0.2s",
                    display: "flex", alignItems: "center",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: overrideClosed ? "#ef4444" : "#38bdf8",
                      transition: "transform 0.2s",
                      transform: overrideClosed ? "translateX(20px)" : "translateX(0)",
                    }} />
                  </div>
                  <span style={{ fontSize: 14, color: overrideClosed ? "#ef4444" : "#e8e4df" }}>
                    {overrideClosed ? "Closed — no bookings on this day" : "Open for bookings"}
                  </span>
                </div>

                {/* Slot editor (only if not closed) */}
                {!overrideClosed && (
                  <div style={{ display: "grid", gap: 18 }}>
                    {TIME_OPTIONS.map((time) => {
                      const selectedLocations = getLocationsForTime(overrideSlots, time);
                      return (
                        <div key={time} style={{ padding: "14px 16px", border: "1px solid rgba(56,189,248,0.08)", background: selectedLocations.length > 0 ? "rgba(56,189,248,0.04)" : "transparent" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 700 }}>{time}</div>
                              <div style={{ fontSize: 12, color: "rgba(232,228,223,0.45)", marginTop: 4 }}>
                                {selectedLocations.length > 0 ? `${selectedLocations.length} selected` : "No locations selected"}
                              </div>
                            </div>
                            {selectedLocations.length > 0 && (
                              <button style={s.btnDanger} onClick={() => clearOverrideTime(time)}>Clear time</button>
                            )}
                          </div>
                          <div>
                            {LOCATIONS.map((location) => (
                              <span key={location} style={s.chip(selectedLocations.includes(location))} onClick={() => toggleOverrideLocation(time, location)}>
                                {location}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
                  <button style={s.btn} onClick={handleSaveOverride} disabled={saving}>
                    {saving ? "Saving..." : "Save Override"}
                  </button>
                  {overrideSaveMsg && <span style={{ fontSize: 14 }}>{overrideSaveMsg}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ Bookings Tab ══ */}
        {tab === "bookings" && (
          <div style={s.card}>
            <h2 style={s.h2}>All Bookings</h2>
            {loading && <p style={{ color: "rgba(232,228,223,0.5)" }}>Loading...</p>}
            {bookingsList.length === 0 && !loading && <p style={{ color: "rgba(232,228,223,0.4)" }}>No bookings yet.</p>}

            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {bookingsList.map((b) => (
                <div key={b.id} style={{ padding: "16px 0", borderBottom: "1px solid rgba(56,189,248,0.06)", opacity: b.status === "cancelled" ? 0.4 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{b.name}</span>
                      <span style={{ marginLeft: 12, fontSize: 11, padding: "2px 8px", background: b.status === "confirmed" ? "rgba(56,189,248,0.15)" : "rgba(239,68,68,0.15)", color: b.status === "confirmed" ? "#38bdf8" : "#ef4444" }}>
                        {b.status}
                      </span>
                      <br />
                      <span style={{ fontSize: 14, color: "rgba(232,228,223,0.7)" }}>{b.date} · {b.time}</span>
                      <br />
                      <span style={{ fontSize: 13, color: "#38bdf8" }}>{b.location}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "rgba(232,228,223,0.5)" }}>
                        {b.email}{b.phone && ` · ${b.phone}`} · {b.experience}
                      </span>
                      {b.message && <p style={{ fontSize: 12, color: "rgba(232,228,223,0.4)", marginTop: 4 }}>&ldquo;{b.message}&rdquo;</p>}
                    </div>
                    {b.status === "confirmed" && (
                      <button style={s.btnDanger} onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
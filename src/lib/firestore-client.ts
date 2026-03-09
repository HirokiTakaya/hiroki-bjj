import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Slot = {
  time: string;
  location: string;
};

export type DaySchedule = {
  slots: Slot[];
};

export type WeeklySchedule = Record<string, DaySchedule>;

export type DateOverride = {
  date: string;
  closed?: boolean;
  slots: Slot[];
};

export type Booking = {
  id: string;
  date: string;
  time: string;
  location: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  message: string;
  status: string;
  createdAt?: Timestamp;
};

export type TimeSlot = {
  time: string;
  locations: string[];
};

export type DayAvailability = {
  id: string;
  date: string;
  timeSlots: TimeSlot[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function sortTimes(a: string, b: string): number {
  return timeToMinutes(a) - timeToMinutes(b);
}

function getVancouverDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getCurrentVancouverMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

function makeSlotId(date: string, time: string, location: string): string {
  return `${date}__${time}__${location}`
    .replace(/\//g, "-")
    .replace(/\s+/g, "_");
}

function normalizeWeeklySlots(data: {
  slots?: Slot[];
  times?: string[];
  locations?: string[];
}): Slot[] {
  if (Array.isArray(data.slots)) {
    return data.slots
      .map((slot) => ({
        time: String(slot?.time ?? "").trim(),
        location: String(slot?.location ?? "").trim(),
      }))
      .filter((slot) => slot.time && slot.location);
  }

  if (Array.isArray(data.times) && Array.isArray(data.locations)) {
    const times = data.times.map((t) => String(t).trim()).filter(Boolean);
    const locations = [
      ...new Set(data.locations.map((l) => String(l).trim()).filter(Boolean)),
    ];

    return times.flatMap((time) =>
      locations.map((location) => ({ time, location }))
    );
  }

  return [];
}

// ─── Weekly Schedule (Admin) ─────────────────────────────────────────────────

export async function fetchWeeklySchedule(): Promise<WeeklySchedule> {
  const snap = await getDocs(collection(db, "weeklySchedule"));
  const schedule: WeeklySchedule = {};

  snap.forEach((docSnap) => {
    const data = docSnap.data() as {
      slots?: Slot[];
      times?: string[];
      locations?: string[];
    };

    schedule[docSnap.id] = { slots: normalizeWeeklySlots(data) };
  });

  return schedule;
}

export async function saveWeeklySchedule(
  schedule: WeeklySchedule
): Promise<void> {
  const batch = writeBatch(db);

  const existing = await getDocs(collection(db, "weeklySchedule"));
  existing.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  for (const [dayOfWeek, data] of Object.entries(schedule)) {
    const slots = (data.slots || [])
      .map((slot) => ({
        time: String(slot.time ?? "").trim(),
        location: String(slot.location ?? "").trim(),
      }))
      .filter((slot) => slot.time && slot.location);

    if (slots.length > 0) {
      const ref = doc(db, "weeklySchedule", dayOfWeek);
      batch.set(ref, { slots });
    }
  }

  await batch.commit();
}

// ─── Date Overrides (Admin) ──────────────────────────────────────────────────

export async function fetchDateOverrides(): Promise<Map<string, DateOverride>> {
  const snap = await getDocs(collection(db, "dateOverrides"));
  const overrides = new Map<string, DateOverride>();

  snap.forEach((docSnap) => {
    const data = docSnap.data() as {
      closed?: boolean;
      slots?: Slot[];
    };

    const slots = (data.slots || [])
      .map((slot) => ({
        time: String(slot?.time ?? "").trim(),
        location: String(slot?.location ?? "").trim(),
      }))
      .filter((slot) => slot.time && slot.location);

    overrides.set(docSnap.id, {
      date: docSnap.id,
      closed: data.closed ?? false,
      slots,
    });
  });

  return overrides;
}

export async function saveDateOverride(
  dateStr: string,
  override: { closed?: boolean; slots: Slot[] }
): Promise<void> {
  const ref = doc(db, "dateOverrides", dateStr);

  const cleanedSlots = (override.slots || [])
    .map((slot) => ({
      time: String(slot.time ?? "").trim(),
      location: String(slot.location ?? "").trim(),
    }))
    .filter((slot) => slot.time && slot.location);

  await setDoc(ref, {
    closed: override.closed ?? false,
    slots: cleanedSlots,
  });
}

export async function deleteDateOverride(dateStr: string): Promise<void> {
  const ref = doc(db, "dateOverrides", dateStr);
  await deleteDoc(ref);
}

// ─── Bookings (Admin) ────────────────────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(db, "bookings"), orderBy("date", "desc"))
  );

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Booking, "id">),
  }));
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const ref = doc(db, "bookings", bookingId);
  await setDoc(ref, { status: "cancelled" }, { merge: true });
}

// ─── Availability (Public) ───────────────────────────────────────────────────

export async function fetchAvailability(): Promise<DayAvailability[]> {
  const today = new Date();
  const todayStr = getVancouverDateString(today);
  const nowMinutes = getCurrentVancouverMinutes();

  // Fetch weekly schedule
  const scheduleSnap = await getDocs(collection(db, "weeklySchedule"));
  const weeklyScheduleByDay = new Map<number, Slot[]>();

  scheduleSnap.forEach((docSnap) => {
    const dayOfWeek = Number(docSnap.id);
    if (Number.isNaN(dayOfWeek)) return;

    const data = docSnap.data() as {
      slots?: Slot[];
      times?: string[];
      locations?: string[];
    };

    weeklyScheduleByDay.set(dayOfWeek, normalizeWeeklySlots(data));
  });

  // Fetch date overrides
  const overridesSnap = await getDocs(collection(db, "dateOverrides"));
  const overridesByDate = new Map<string, { closed: boolean; slots: Slot[] }>();

  overridesSnap.forEach((docSnap) => {
    const data = docSnap.data() as { closed?: boolean; slots?: Slot[] };
    const slots = (data.slots || [])
      .map((slot) => ({
        time: String(slot?.time ?? "").trim(),
        location: String(slot?.location ?? "").trim(),
      }))
      .filter((slot) => slot.time && slot.location);

    overridesByDate.set(docSnap.id, {
      closed: data.closed ?? false,
      slots,
    });
  });

  // Fetch confirmed bookings from today onwards
  const bookingsSnap = await getDocs(
    query(
      collection(db, "bookings"),
      where("date", ">=", todayStr),
      where("status", "==", "confirmed")
    )
  );

  const bookingsByDate = new Map<string, Array<{ time: string; location: string }>>();

  bookingsSnap.forEach((docSnap) => {
    const data = docSnap.data() as {
      date?: string;
      time?: string;
      location?: string;
    };

    const date = String(data.date ?? "").trim();
    const time = String(data.time ?? "").trim();
    const location = String(data.location ?? "").trim();

    if (!date || !time || !location) return;

    if (!bookingsByDate.has(date)) bookingsByDate.set(date, []);
    bookingsByDate.get(date)!.push({ time, location });
  });

  // Generate availability for next 60 days (skip today and tomorrow)
  const daysAhead = 60;
  const result: DayAvailability[] = [];

  for (let i = 2; i < daysAhead; i++) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + i);

    const dateStr = getVancouverDateString(dateObj);

    // Check date override first
    const override = overridesByDate.get(dateStr);

    let daySlots: Slot[];

    if (override) {
      // If closed, skip this day entirely
      if (override.closed) continue;
      // Use override slots instead of weekly template
      daySlots = override.slots;
    } else {
      // Fall back to weekly schedule
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      daySlots = weeklyScheduleByDay.get(dayOfWeek) ?? [];
    }

    if (daySlots.length === 0) continue;

    const dayBookings = bookingsByDate.get(dateStr) ?? [];
    const timeMap = new Map<string, string[]>();

    const uniqueTimes = [
      ...new Set(daySlots.map((slot) => slot.time).filter(Boolean)),
    ].sort(sortTimes);

    for (const time of uniqueTimes) {
      if (dateStr === todayStr && timeToMinutes(time) <= nowMinutes) continue;

      const scheduledLocations = [
        ...new Set(
          daySlots
            .filter((slot) => slot.time === time)
            .map((slot) => slot.location)
            .filter(Boolean)
        ),
      ];

      const exactBookedLocations = new Set(
        dayBookings.filter((b) => b.time === time).map((b) => b.location)
      );

      let availableLocations = scheduledLocations.filter(
        (loc) => !exactBookedLocations.has(loc)
      );

      const nearbyBookings = dayBookings.filter((b) => {
        return Math.abs(timeToMinutes(b.time) - timeToMinutes(time)) <= 120;
      });

      if (nearbyBookings.length > 0) {
        const lockedLocations = new Set(nearbyBookings.map((b) => b.location));
        availableLocations = availableLocations.filter((loc) =>
          lockedLocations.has(loc)
        );
      }

      availableLocations = [...new Set(availableLocations)].sort();

      if (availableLocations.length > 0) {
        timeMap.set(time, availableLocations);
      }
    }

    const timeSlots = Array.from(timeMap.entries()).map(([time, locations]) => ({
      time,
      locations,
    }));

    if (timeSlots.length === 0) continue;

    result.push({
      id: dateStr,
      date: dateStr,
      timeSlots,
    });
  }

  return result;
}

// ─── Create Booking (Public) ─────────────────────────────────────────────────

export type CreateBookingInput = {
  date: string;
  time: string;
  location: string;
  name: string;
  email: string;
  phone?: string;
  experience?: string;
  message?: string;
};

export type CreateBookingResult =
  | { success: true; bookingId: string }
  | { success: false; error: string };

export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const { date, time, location, name, email, phone, experience, message } = input;

  if (!date || !time || !location || !name || !email) {
    return { success: false, error: "Missing required fields" };
  }

  // 0. Block same-day and next-day bookings
  const today = new Date();
  const todayStr = getVancouverDateString(today);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getVancouverDateString(tomorrow);

  if (date === todayStr || date === tomorrowStr) {
    return {
      success: false,
      error: "Bookings must be made at least 2 days in advance",
    };
  }

  // 1. Check date override first, then weekly schedule
  const overrideDoc = await getDoc(doc(db, "dateOverrides", date));
  let validSlots: Slot[];

  if (overrideDoc.exists()) {
    const overrideData = overrideDoc.data() as { closed?: boolean; slots?: Slot[] };

    if (overrideData.closed) {
      return { success: false, error: "This date is not available" };
    }

    validSlots = (overrideData.slots || [])
      .map((slot) => ({
        time: String(slot?.time ?? "").trim(),
        location: String(slot?.location ?? "").trim(),
      }))
      .filter((slot) => slot.time && slot.location);
  } else {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const weeklyDoc = await getDoc(doc(db, "weeklySchedule", String(dayOfWeek)));

    if (!weeklyDoc.exists()) {
      return { success: false, error: "This slot is not available" };
    }

    const weeklyData = weeklyDoc.data() as {
      slots?: Slot[];
      times?: string[];
      locations?: string[];
    };

    validSlots = normalizeWeeklySlots(weeklyData);
  }

  const scheduledForThisTime = validSlots
    .filter((slot) => slot.time === time)
    .map((slot) => slot.location);

  if (!scheduledForThisTime.includes(location)) {
    return { success: false, error: "This slot is not available" };
  }

  // 2. Fetch confirmed bookings for this date
  const bookingsSnap = await getDocs(
    query(
      collection(db, "bookings"),
      where("date", "==", date),
      where("status", "==", "confirmed")
    )
  );

  const dayBookings = bookingsSnap.docs.map((docSnap) => {
    const data = docSnap.data() as { time?: string; location?: string };
    return {
      time: String(data.time ?? "").trim(),
      location: String(data.location ?? "").trim(),
    };
  });

  // 3. Check exact duplicate
  const exactAlreadyBooked = dayBookings.some(
    (b) => b.time === time && b.location === location
  );

  if (exactAlreadyBooked) {
    return { success: false, error: "Slot already booked" };
  }

  // 4. ±2 hour location lock
  const nearbyBookings = dayBookings.filter((b) => {
    return Math.abs(timeToMinutes(b.time) - timeToMinutes(time)) <= 120;
  });

  if (nearbyBookings.length > 0) {
    const lockedLocations = new Set(nearbyBookings.map((b) => b.location));

    if (!lockedLocations.has(location)) {
      return {
        success: false,
        error: "This location is not available within 2 hours of another booking",
      };
    }
  }

  // 5. Create booking with deterministic ID
  const slotId = makeSlotId(date, time, location);
  const bookingRef = doc(db, "bookings", slotId);

  const existingDoc = await getDoc(bookingRef);
  if (existingDoc.exists()) {
    return { success: false, error: "Slot already booked" };
  }

  await setDoc(bookingRef, {
    date,
    time,
    location,
    name,
    email,
    phone: phone || "",
    experience: experience || "",
    message: message || "",
    status: "confirmed",
    createdAt: Timestamp.now(),
  });

  return { success: true, bookingId: slotId };
}
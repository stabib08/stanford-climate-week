import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import type { Tables } from "@/lib/database.types";

/**
 * Add an event to the device calendar (iOS/Android). On web we generate a
 * downloadable .ics file instead. Returns true on success.
 */
export async function addEventToCalendar(
  event: Pick<Tables<"events">, "title" | "location" | "starts_at" | "ends_at" | "description">,
): Promise<boolean> {
  if (Platform.OS === "web") {
    downloadIcs(event);
    return true;
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") return false;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable =
    calendars.find((c) => c.allowsModifications && c.source?.name === "Default") ??
    calendars.find((c) => c.allowsModifications);
  if (!writable) return false;

  await Calendar.createEventAsync(writable.id, {
    title: event.title,
    location: event.location,
    notes: event.description ?? undefined,
    startDate: new Date(event.starts_at),
    endDate: new Date(event.ends_at),
    alarms: [{ relativeOffset: -30 }],
  });
  return true;
}

function downloadIcs(
  event: Pick<Tables<"events">, "title" | "location" | "starts_at" | "ends_at" | "description">,
) {
  const dt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stanford Climate Week//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dt(event.starts_at)}`,
    `DTEND:${dt(event.ends_at)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${(event.description ?? "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // Browser-only download path.
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

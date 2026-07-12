import { format, isSameDay, parseISO } from "date-fns";

export const fmtDay = (iso: string) => format(parseISO(iso), "EEE, MMM d");
export const fmtTime = (iso: string) => format(parseISO(iso), "h:mm a");
export const fmtDayTime = (iso: string) => format(parseISO(iso), "EEE, MMM d · h:mm a");

export const fmtRange = (startIso: string, endIso: string) => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  if (isSameDay(start, end)) {
    return `${format(start, "EEE, MMM d · h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`;
};

/** True once we are within `minutes` before start, up to the event end. */
export const isWithinCheckInWindow = (
  startIso: string,
  endIso: string,
  minutes = 10,
  now: Date = new Date(),
): boolean => {
  const opens = new Date(parseISO(startIso).getTime() - minutes * 60_000);
  const closes = parseISO(endIso);
  return now >= opens && now <= closes;
};

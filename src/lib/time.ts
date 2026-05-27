import "server-only";

const JAKARTA_TIMEZONE = "Asia/Jakarta";

export function getTodayInJakarta(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

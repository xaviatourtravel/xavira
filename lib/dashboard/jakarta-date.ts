const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function getJakartaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function toJakartaDateString(value: string) {
  return getJakartaDateString(new Date(value));
}

export function getJakartaMonthKey(dateString: string) {
  return dateString.slice(0, 7);
}

export function isSameJakartaMonth(
  dateString: string,
  referenceDateString: string,
) {
  return (
    getJakartaMonthKey(dateString) === getJakartaMonthKey(referenceDateString)
  );
}

export function getJakartaDaysAgoDateString(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getJakartaDateString(date);
}

export function isOnOrAfterJakartaDate(
  dateString: string,
  cutoffDateString: string,
) {
  return dateString >= cutoffDateString;
}

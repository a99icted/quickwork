export const money = (value) =>
  value == null
    ? "По договорённости"
    : `${new Intl.NumberFormat("ru-RU").format(value)} RSD`;
export const cityLabel = (city) =>
  ({
    "Novi-sad": "Нови-Сад",
    Belgrade: "Белград",
    Beograd: "Белград",
    Nis: "Ниш",
  })[city] ||
  city ||
  "Город не указан";
export const localDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Barnaul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function addDays(offset, from = localDate()) {
  const date = new Date(`${from}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const dateLabel = (
  value,
  options = { day: "numeric", month: "long" },
) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", options).format(
        new Date(`${value}T12:00:00`),
      )
    : "Дата не указана";
export const timeLabel = (value) => value?.slice(0, 5) || "—";
export function hours(work) {
  const [a, b] = (work.time_from || "00:00").split(":").map(Number);
  const [c, d] = (work.time_to || "00:00").split(":").map(Number);
  return (c * 60 + d - a * 60 - b + (work.ends_next_day ? 1440 : 0)) / 60;
}
export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
export const statusLabels = {
  pending: "На рассмотрении",
  approved: "Вы приглашены",
  rejected: "Не подошли",
};

export function plural(value, forms) {
  const lastTwo = Math.abs(value) % 100;
  const last = lastTwo % 10;
  return forms[
    lastTwo >= 11 && lastTwo <= 14
      ? 2
      : last === 1
        ? 0
        : last >= 2 && last <= 4
          ? 1
          : 2
  ];
}

export function selectionIds(work, kind) {
  const list = work?.[kind === "categories" ? "category_ids" : "feature_ids"];
  const scalar = work?.[kind === "categories" ? "category_id" : "features_id"];
  return Array.isArray(list) ? list : scalar ? [scalar] : [];
}
export const normalizeCity = (value = "") => (value || "").trim().replace(/\s+/g, " ").toLowerCase();

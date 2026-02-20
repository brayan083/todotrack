const toLocalDateFromUTC = (value: Date) =>
  new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

export const formatDateLabel = (value: Date) =>
  toLocalDateFromUTC(value).toLocaleDateString();

export const formatDateInputValue = (value: Date) => {
  const localDate = toLocalDateFromUTC(value);
  const year = localDate.getFullYear();
  const month = `${localDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${localDate.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

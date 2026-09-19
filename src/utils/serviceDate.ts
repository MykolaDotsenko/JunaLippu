const ISO_SERVICE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatServiceDate = (isoDate: string) => {
  const match = ISO_SERVICE_DATE.exec(isoDate);
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return isoDate;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

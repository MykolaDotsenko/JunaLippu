export const timeToMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const minutesToDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h ${remainder.toString().padStart(2, "0")} min`;
};

export const calculateJourneyPrice = (
  durationMinutes: number,
  travelClass: number,
) => {
  const basePrice = (durationMinutes / 60) * 120 * 0.16;
  const classMultiplier = travelClass === 1 ? 1.5 : 1;
  return Number((basePrice * classMultiplier).toFixed(2));
};

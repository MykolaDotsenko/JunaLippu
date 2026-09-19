export const timeToMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const minutesToDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h ${remainder.toString().padStart(2, "0")} min`;
};

export const calculateJourneyPriceCents = (
  durationMinutes: number,
  travelClass: 1 | 2,
) => {
  const basePriceCents = (durationMinutes / 60) * 120 * 16;
  const classMultiplier = travelClass === 1 ? 1.5 : 1;
  return Math.round(basePriceCents * classMultiplier);
};

export const centsToEuros = (priceCents: number) => priceCents / 100;

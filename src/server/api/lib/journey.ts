export const timeToMinutes = (value: string) => {
  const match = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
  if (!match) {
    throw new RangeError(`Invalid timetable time: ${value}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
};

export const minutesToDuration = (minutes: number) => {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new RangeError("Journey duration must be a non-negative integer.");
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h ${remainder.toString().padStart(2, "0")} min`;
};

const SECOND_CLASS_CENTS_PER_HOUR = 1920;
const FIRST_CLASS_MULTIPLIER = 1.5;

export const calculateJourneyPriceCents = (
  durationMinutes: number,
  travelClass: 1 | 2,
) => {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    throw new RangeError("Journey duration must be non-negative.");
  }

  const secondClassPrice =
    (durationMinutes / 60) * SECOND_CLASS_CENTS_PER_HOUR;
  const classMultiplier = travelClass === 1 ? FIRST_CLASS_MULTIPLIER : 1;

  return Math.round(secondClassPrice * classMultiplier);
};

export const centsToEuros = (priceCents: number) => priceCents / 100;

export const findForwardStopPair = <
  TDeparture extends { stop_sequence: number },
  TArrival extends { stop_sequence: number },
>(
  departures: TDeparture[],
  arrivals: TArrival[],
) => {
  const orderedDepartures = [...departures].sort(
    (a, b) => a.stop_sequence - b.stop_sequence,
  );
  const orderedArrivals = [...arrivals].sort(
    (a, b) => a.stop_sequence - b.stop_sequence,
  );

  for (const departure of orderedDepartures) {
    const arrival = orderedArrivals.find(
      (candidate) => candidate.stop_sequence > departure.stop_sequence,
    );
    if (arrival) return { departure, arrival };
  }

  return null;
};

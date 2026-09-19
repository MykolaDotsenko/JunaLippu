export type TravelClass = 1 | 2;

export const SECOND_CLASS_FARE_CENTS_PER_HOUR = 1920;
export const FIRST_CLASS_FARE_MULTIPLIER = 1.5;

const MINUTES_PER_HOUR = 60;

export const timeToMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * MINUTES_PER_HOUR + Number(minutes);
};

export const journeyDurationMinutes = (
  departureTime: string,
  arrivalTime: string,
): number | null => {
  const departure = timeToMinutes(departureTime);
  const arrival = timeToMinutes(arrivalTime);

  if (!Number.isFinite(departure) || !Number.isFinite(arrival)) return null;

  const difference = arrival - departure;
  return difference < 0 ? null : difference;
};

export const minutesToDuration = (minutes: number) => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainder = minutes % MINUTES_PER_HOUR;
  return `${hours} h ${remainder.toString().padStart(2, "0")} min`;
};

export const calculateJourneyPriceCents = (
  durationMinutes: number,
  travelClass: TravelClass,
) => {
  const basePriceCents =
    (durationMinutes / MINUTES_PER_HOUR) * SECOND_CLASS_FARE_CENTS_PER_HOUR;
  const classMultiplier = travelClass === 1 ? FIRST_CLASS_FARE_MULTIPLIER : 1;
  return Math.round(basePriceCents * classMultiplier);
};

export const centsToEuros = (priceCents: number) => priceCents / 100;

type SequencedStop = { stop_sequence: number };

export const pickJourneyStops = <
  TDeparture extends SequencedStop,
  TArrival extends SequencedStop,
>(
  departures: readonly TDeparture[],
  arrivals: readonly TArrival[],
): { departure: TDeparture; arrival: TArrival } | null => {
  const bySequence = (a: SequencedStop, b: SequencedStop) =>
    a.stop_sequence - b.stop_sequence;

  const sortedDepartures = [...departures].sort(bySequence);
  const sortedArrivals = [...arrivals].sort(bySequence);

  for (const departure of sortedDepartures) {
    const arrival = sortedArrivals.find(
      (candidate) => candidate.stop_sequence > departure.stop_sequence,
    );
    if (arrival) return { departure, arrival };
  }

  return null;
};

export const segmentSequences = (
  departureSequence: number,
  arrivalSequence: number,
) =>
  Array.from(
    { length: arrivalSequence - departureSequence },
    (_, index) => departureSequence + index,
  );

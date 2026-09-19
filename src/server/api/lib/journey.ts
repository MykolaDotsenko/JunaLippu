export type TravelClass = 1 | 2;

export const SECOND_CLASS_FARE_CENTS_PER_HOUR = 1920;
export const FIRST_CLASS_FARE_MULTIPLIER = 1.5;

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const GTFS_TIME = /^(\d+):([0-5]\d):([0-5]\d)$/;

export const timeToSeconds = (value: string): number | null => {
  const match = GTFS_TIME.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const totalSeconds =
    hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;

  return Number.isSafeInteger(totalSeconds) ? totalSeconds : null;
};

export const compareGtfsTimes = (left: string, right: string) => {
  const leftSeconds = timeToSeconds(left);
  const rightSeconds = timeToSeconds(right);

  if (leftSeconds === null && rightSeconds === null) {
    return left.localeCompare(right);
  }
  if (leftSeconds === null) return 1;
  if (rightSeconds === null) return -1;
  return leftSeconds - rightSeconds;
};

export const journeyDurationSeconds = (
  departureTime: string,
  arrivalTime: string,
): number | null => {
  const departure = timeToSeconds(departureTime);
  const arrival = timeToSeconds(arrivalTime);

  if (departure === null || arrival === null) return null;

  const difference = arrival - departure;
  return difference < 0 ? null : difference;
};

export const secondsToDuration = (seconds: number) => {
  const roundedMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(roundedMinutes / SECONDS_PER_MINUTE);
  const minutes = roundedMinutes % SECONDS_PER_MINUTE;
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
};

export const calculateJourneyPriceCents = (
  durationSeconds: number,
  travelClass: TravelClass,
) => {
  const basePriceCents =
    (durationSeconds / SECONDS_PER_HOUR) * SECOND_CLASS_FARE_CENTS_PER_HOUR;
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

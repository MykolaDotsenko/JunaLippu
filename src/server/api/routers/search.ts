import { z } from "zod";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  compareGtfsTimes,
  journeyDurationSeconds,
  pickJourneyStops,
  secondsToDuration,
} from "~/server/api/lib/journey";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const routeShape = {
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
};

const hasDistinctStops = (value: {
  dep_stop_id: string;
  arriv_stop_id: string;
}) => value.dep_stop_id !== value.arriv_stop_id;

const distinctStopsError = {
  message: "Departure and arrival stations must be different.",
};

const routeInput = z
  .object(routeShape)
  .refine(hasDistinctStops, distinctStopsError);

const searchInput = z
  .object({
    ...routeShape,
    travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(hasDistinctStops, distinctStopsError);

const groupByTrip = <T extends { trip_id: string }>(calls: readonly T[]) => {
  const byTrip = new Map<string, T[]>();
  for (const call of calls) {
    const existing = byTrip.get(call.trip_id);
    if (existing) {
      existing.push(call);
    } else {
      byTrip.set(call.trip_id, [call]);
    }
  }
  return byTrip;
};

export const searchRouter = createTRPCRouter({
  getStationName: publicProcedure.query(({ ctx }) =>
    ctx.db.stop.findMany({
      select: {
        stop_id: true,
        stop_name: true,
      },
      orderBy: {
        stop_name: "asc",
      },
    }),
  ),

  getAvailableDates: publicProcedure
    .input(routeInput)
    .query(async ({ input, ctx }) => {
      const departureCalls = await ctx.db.stop_time.findMany({
        where: { stop_id: input.dep_stop_id },
        select: {
          trip_id: true,
          stop_sequence: true,
          departure_time: true,
          trip: {
            select: {
              service_date: true,
            },
          },
        },
      });

      if (departureCalls.length === 0) return [];

      const arrivalCalls = await ctx.db.stop_time.findMany({
        where: {
          stop_id: input.arriv_stop_id,
          trip_id: { in: departureCalls.map((call) => call.trip_id) },
        },
        select: {
          trip_id: true,
          stop_sequence: true,
          arrival_time: true,
        },
      });

      const arrivalsByTrip = groupByTrip(arrivalCalls);
      const serviceDates = new Set<string>();

      for (const [tripId, departures] of groupByTrip(departureCalls)) {
        const journey = pickJourneyStops(
          departures,
          arrivalsByTrip.get(tripId) ?? [],
        );
        if (!journey) continue;

        const durationSeconds = journeyDurationSeconds(
          journey.departure.departure_time,
          journey.arrival.arrival_time,
        );
        if (durationSeconds === null) continue;

        serviceDates.add(journey.departure.trip.service_date);
      }

      return Array.from(serviceDates).sort();
    }),

  getSchedule: publicProcedure
    .input(searchInput)
    .query(async ({ input, ctx }) => {
      const trips = await ctx.db.trip.findMany({
        where: {
          service_date: input.travel_date,
          stop_times: {
            some: {
              stop_id: input.dep_stop_id,
            },
          },
        },
        select: {
          trip_id: true,
          route: {
            select: {
              train: {
                select: {
                  train_number: true,
                },
              },
            },
          },
          stop_times: {
            where: {
              stop_id: {
                in: [input.dep_stop_id, input.arriv_stop_id],
              },
            },
            select: {
              stop_id: true,
              departure_time: true,
              arrival_time: true,
              stop_sequence: true,
            },
          },
        },
      });

      return trips
        .flatMap((trip) => {
          const journey = pickJourneyStops(
            trip.stop_times.filter(
              (call) => call.stop_id === input.dep_stop_id,
            ),
            trip.stop_times.filter(
              (call) => call.stop_id === input.arriv_stop_id,
            ),
          );

          if (!journey) return [];

          const { departure, arrival } = journey;
          const durationSeconds = journeyDurationSeconds(
            departure.departure_time,
            arrival.arrival_time,
          );

          if (durationSeconds === null) return [];

          const minPriceCents = calculateJourneyPriceCents(durationSeconds, 2);

          return [
            {
              trip_id: trip.trip_id,
              train_number: trip.route.train.train_number,
              departure_time: departure.departure_time,
              arrival_time: arrival.arrival_time,
              duration_seconds: durationSeconds,
              duration: secondsToDuration(durationSeconds),
              min_price: centsToEuros(minPriceCents),
            },
          ];
        })
        .sort((a, b) => compareGtfsTimes(a.departure_time, b.departure_time));
    }),
});

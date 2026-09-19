import { z } from "zod";

import {
  calculateJourneyPrice,
  minutesToDuration,
  timeToMinutes,
} from "~/server/api/lib/journey";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const searchInput = z.object({
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const routeInput = z.object({
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
});

const getDateFromTripId = (tripId: string) => {
  const match = tripId.match(/(\d{8})$/);
  if (!match?.[1]) return null;
  const value = match[1];
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
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
      const departureStops = await ctx.db.stop_time.findMany({
        where: { stop_id: input.dep_stop_id },
        select: {
          trip_id: true,
          stop_sequence: true,
        },
      });

      if (departureStops.length === 0) return [];

      const arrivals = await ctx.db.stop_time.findMany({
        where: {
          stop_id: input.arriv_stop_id,
          trip_id: { in: departureStops.map((stop) => stop.trip_id) },
        },
        select: {
          trip_id: true,
          stop_sequence: true,
        },
      });

      const arrivalByTrip = new Map(
        arrivals.map((arrival) => [arrival.trip_id, arrival.stop_sequence]),
      );

      return Array.from(
        new Set(
          departureStops.flatMap((departure) => {
            const arrivalSequence = arrivalByTrip.get(departure.trip_id);
            if (
              arrivalSequence === undefined ||
              departure.stop_sequence >= arrivalSequence
            ) {
              return [];
            }
            const date = getDateFromTripId(departure.trip_id);
            return date ? [date] : [];
          }),
        ),
      ).sort();
    }),

  getSchedule: publicProcedure
    .input(searchInput)
    .query(async ({ input, ctx }) => {
      const dateKey = input.travel_date.replaceAll("-", "");

      const departureStops = (
        await ctx.db.stop_time.findMany({
          where: { stop_id: input.dep_stop_id },
          select: {
            trip_id: true,
            departure_time: true,
            stop_sequence: true,
          },
        })
      ).filter((stop) => stop.trip_id.endsWith(dateKey));

      if (departureStops.length === 0) return [];

      const tripIds = departureStops.map((stop) => stop.trip_id);

      const [arrivalStops, trips] = await Promise.all([
        ctx.db.stop_time.findMany({
          where: {
            stop_id: input.arriv_stop_id,
            trip_id: { in: tripIds },
          },
          select: {
            trip_id: true,
            arrival_time: true,
            stop_sequence: true,
          },
        }),
        ctx.db.trip.findMany({
          where: { trip_id: { in: tripIds } },
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
          },
        }),
      ]);

      const arrivalsByTrip = new Map(
        arrivalStops.map((stop) => [stop.trip_id, stop]),
      );
      const trainsByTrip = new Map(
        trips.map((trip) => [trip.trip_id, trip.route.train.train_number]),
      );

      return departureStops
        .flatMap((departure) => {
          const arrival = arrivalsByTrip.get(departure.trip_id);
          if (!arrival || departure.stop_sequence >= arrival.stop_sequence) return [];

          const durationMinutes =
            timeToMinutes(arrival.arrival_time) -
            timeToMinutes(departure.departure_time);

          if (durationMinutes < 0) return [];

          return [{
            trip_id: departure.trip_id,
            train_number: trainsByTrip.get(departure.trip_id) ?? "Train",
            departure_time: departure.departure_time,
            arrival_time: arrival.arrival_time,
            duration_minutes: durationMinutes,
            duration: minutesToDuration(durationMinutes),
            min_price: calculateJourneyPrice(durationMinutes, 2),
          }];
        })
        .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }),
});

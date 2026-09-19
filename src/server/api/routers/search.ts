import { z } from "zod";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  findForwardStopPair,
  minutesToDuration,
  timeToMinutes,
} from "~/server/api/lib/journey";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const routeInput = z.object({
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
});

const searchInput = routeInput.extend({
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const searchRouter = createTRPCRouter({
  getRouteContext: publicProcedure
    .input(routeInput)
    .query(async ({ input, ctx }) => {
      const [departure, arrival] = await Promise.all([
        ctx.db.stop.findUnique({
          where: { stop_id: input.dep_stop_id },
          select: { stop_id: true, stop_name: true },
        }),
        ctx.db.stop.findUnique({
          where: { stop_id: input.arriv_stop_id },
          select: { stop_id: true, stop_name: true },
        }),
      ]);

      if (!departure || !arrival || departure.stop_id === arrival.stop_id) {
        return null;
      }

      return {
        departure_stop_name: departure.stop_name,
        arrival_stop_name: arrival.stop_name,
      };
    }),

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
          trip: {
            select: {
              service_date: true,
            },
          },
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

      const arrivalsByTrip = new Map<string, typeof arrivals>();
      for (const arrival of arrivals) {
        const group = arrivalsByTrip.get(arrival.trip_id) ?? [];
        group.push(arrival);
        arrivalsByTrip.set(arrival.trip_id, group);
      }

      const departuresByTrip = new Map<string, typeof departureStops>();
      for (const departure of departureStops) {
        const group = departuresByTrip.get(departure.trip_id) ?? [];
        group.push(departure);
        departuresByTrip.set(departure.trip_id, group);
      }

      return Array.from(
        new Set(
          Array.from(departuresByTrip.entries()).flatMap(([tripId, departures]) => {
            const pair = findForwardStopPair(
              departures,
              arrivalsByTrip.get(tripId) ?? [],
            );
            return pair ? [pair.departure.trip.service_date] : [];
          }),
        ),
      ).sort();
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
          const pair = findForwardStopPair(
            trip.stop_times.filter((stop) => stop.stop_id === input.dep_stop_id),
            trip.stop_times.filter((stop) => stop.stop_id === input.arriv_stop_id),
          );

          if (!pair) return [];

          const { departure, arrival } = pair;

          const durationMinutes =
            timeToMinutes(arrival.arrival_time) -
            timeToMinutes(departure.departure_time);

          if (durationMinutes < 0) return [];

          const minPriceCents = calculateJourneyPriceCents(durationMinutes, 2);

          return [{
            trip_id: trip.trip_id,
            train_number: trip.route.train.train_number,
            departure_time: departure.departure_time,
            arrival_time: arrival.arrival_time,
            duration_minutes: durationMinutes,
            duration: minutesToDuration(durationMinutes),
            min_price: centsToEuros(minPriceCents),
          }];
        })
        .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }),
});

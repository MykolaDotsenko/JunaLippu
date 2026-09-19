import { z } from "zod";

import {
  calculateJourneyPriceCents,
  centsToEuros,
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
            return [departure.trip.service_date];
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
          const departure = trip.stop_times.find(
            (stop) => stop.stop_id === input.dep_stop_id,
          );
          const arrival = trip.stop_times.find(
            (stop) => stop.stop_id === input.arriv_stop_id,
          );

          if (
            !departure ||
            !arrival ||
            departure.stop_sequence >= arrival.stop_sequence
          ) {
            return [];
          }

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

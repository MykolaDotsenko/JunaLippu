import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const searchInput = z.object({
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
});

const timeToMinutes = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const minutesToDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder.toString().padStart(2, "0")}m`;
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

  getSchedule: publicProcedure
    .input(searchInput)
    .query(async ({ input, ctx }) => {
      const departureStops = await ctx.db.stop_time.findMany({
        where: { stop_id: input.dep_stop_id },
        select: {
          trip_id: true,
          departure_time: true,
          stop_sequence: true,
        },
      });

      const arrivalStops = await ctx.db.stop_time.findMany({
        where: {
          stop_id: input.arriv_stop_id,
          trip_id: { in: departureStops.map((stop) => stop.trip_id) },
        },
        select: {
          trip_id: true,
          arrival_time: true,
          stop_sequence: true,
        },
      });

      const arrivalsByTrip = new Map(
        arrivalStops.map((stop) => [stop.trip_id, stop]),
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
            departure_time: departure.departure_time,
            arrival_time: arrival.arrival_time,
            duration_minutes: durationMinutes,
            duration: minutesToDuration(durationMinutes),
            min_price: Number((durationMinutes / 60 * 120 * 0.16).toFixed(2)),
          }];
        })
        .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }),
});

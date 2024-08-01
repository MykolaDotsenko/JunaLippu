import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

interface Context {
  db: PrismaClient;
}

  export const searchRouter = createTRPCRouter({ 
//The procedure "getStationName" provides an array of stations names (stop_name) 
// to show to the user in a search form. It also provides respective stops IDs. 
// Selected stops IDs should be forwarded to the backend as dep_stop_id 
// and arriv_stop_id to perform the next procedure.

  getStationName: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.stop.findMany({
      select: {
        stop_id: true,
        stop_name: true,
      },
    });
  }),

  // The getSchedule procedure gets as an input a departure station's ID
  // and arrival station's ID and query the database for available times.
  getSchedule: publicProcedure
    .input(
      z.object({
        dep_stop_id: z.string(),
        arriv_stop_id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.$queryRaw`
        SELECT T1.trip_id, T1.stop_id, T1.departure_time, 
              T2.stop_id, T2.arrival_time
        FROM Stop_time as T1
        INNER JOIN Stop_time as T2 ON T2.trip_id=T1.trip_id
        WHERE T1.stop_id='${input.dep_stop_id}' AND T2.stop_id='${input.arriv_stop_id}' 
        AND T1.stop_sequence < T2.stop_sequence;
      `;
      return results;
    }),

  // The getTripDuration procedure gets departure station's
  // and arrival station's IDs as an input and calculates the trip duration (in format HH:MM:SS).
  getTripDuration: publicProcedure
    .input(
      z.object({
        dep_stop_id: z.string(),
        arriv_stop_id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.$queryRaw`
        SELECT T2.arrival_time, T1.departure_time, strftime('%H:%M:%S',(unixepoch(T2.arrival_time)-unixepoch(T1.departure_time)),'unixepoch') AS trip_duration
        FROM Stop_time as T1
        INNER JOIN Stop_time as T2 ON T2.trip_id=T1.trip_id
        WHERE T1.stop_id='${input.dep_stop_id}' AND T2.stop_id='${input.arriv_stop_id}' 
        AND T1.stop_sequence < T2.stop_sequence;
      `
      return results
      }),
    
// The getMinPrice procedure gets departure station's 
// and arrival station's IDs as an input from the user and 
// calculates the minimum price for the trip. 
    getMinPrice: publicProcedure
    .input(z.object({ 
      dep_stop_id: z.string(), 
      arriv_stop_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.$queryRaw`
        SELECT (unixepoch(T2.arrival_time)-unixepoch(T1.departure_time))/3600*120*0.16 AS min_price 
        FROM Stop_time as T1 
        INNER JOIN Stop_time as T2 ON T2.trip_id=T1.trip_id 
        WHERE T1.stop_id='${input.dep_stop_id}' AND T2.stop_id='${input.arriv_stop_id}' AND T1.stop_sequence < T2.stop_sequence;
      `
      return results
    }),
  });
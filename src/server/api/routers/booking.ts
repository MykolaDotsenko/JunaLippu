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

  export const bookingRouter = createTRPCRouter({ 
//The procedure "getSeat" gets: travel class and trip_id as an input from a user; 
// checks for available seats and 
// provides in return all available seat_ids, seat_numbers, car_ids, car_numbers, train_ids, train_numbers.   

    getSeat: publicProcedure
    .input(z.object({ 
      travel_class: z.number(), 
      trip_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.$queryRaw`
    SELECT seat_id, seat_number, car_id, car_number, train_id, train_number
    FROM Seat
    JOIN Train_composition ON Train_composition.car_id = Seat.car_id
    JOIN Train ON Train.train_id=Train_composition.train_id
    JOIN Route ON Route.train_id=Train.train_id
    JOIN Trip ON Trip.route_id=Route.route_id
    WHERE travel_class=${input.travel_class} AND reserved=0 AND trip_id='${input.trip_id}';
      `;
      return results;
    }),

//The procedure "getReservation" creates a record in the database that the seat is reserved. 
//This will be changed to a protected procedure after implementing authentication.

    getReservation: publicProcedure 
      .input(z.object({ 
        user_id: z.string(),
        seat_id: z.number(),
        trip_id: z.string(), 
        dep_stop_id: z.string(), 
        arriv_stop_id: z.string(),    
        price: z.number(),
        departure_time: z.string(),
        arrival_time: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
          const reservation = await ctx.db.reservation.create({
            data: {
              user_id: input.user_id,
              seat_id: input.seat_id,
              trip_id: input.trip_id,
              dep_stop_id: input.trip_id, 
              arriv_stop_id: input.trip_id,    
              price: input.price,
              departure_time: input.departure_time,
              arrival_time: input.arrival_time,
            }
          })
    })
  });
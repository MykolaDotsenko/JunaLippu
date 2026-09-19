import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const bookingRouter = createTRPCRouter({
  getSeat: publicProcedure
    .input(
      z.object({
        travel_class: z.number().int().min(1).max(2),
        trip_id: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const trip = await ctx.db.trip.findUnique({
        where: { trip_id: input.trip_id },
        include: {
          route: {
            include: {
              train: {
                include: {
                  composition: {
                    include: {
                      car: {
                        include: {
                          seats: {
                            where: { travel_class: input.travel_class },
                            include: {
                              reservations: {
                                where: { trip_id: input.trip_id },
                                select: { reservation_id: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      return trip.route.train.composition
        .flatMap((composition) =>
          composition.car.seats
            .filter((seat) => seat.reservations.length === 0)
            .map((seat) => ({
              seat_id: seat.seat_id,
              seat_number: seat.seat_number,
              car_id: composition.car_id,
              car_number: composition.car_number,
              train_id: trip.route.train_id,
              train_number: trip.route.train.train_number,
            })),
        )
        .sort((a, b) => a.car_number - b.car_number || a.seat_number - b.seat_number);
    }),

  createReservation: protectedProcedure
    .input(
      z.object({
        seat_id: z.number().int(),
        trip_id: z.string().min(1),
        dep_stop_id: z.string().min(1),
        arriv_stop_id: z.string().min(1),
        price: z.number().nonnegative(),
        departure_time: z.string().min(1),
        arrival_time: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [departure, arrival, seat] = await Promise.all([
        ctx.db.stop_time.findFirst({
          where: { trip_id: input.trip_id, stop_id: input.dep_stop_id },
          select: { stop_sequence: true },
        }),
        ctx.db.stop_time.findFirst({
          where: { trip_id: input.trip_id, stop_id: input.arriv_stop_id },
          select: { stop_sequence: true },
        }),
        ctx.db.seat.findUnique({
          where: { seat_id: input.seat_id },
          select: { seat_id: true },
        }),
      ]);

      if (!departure || !arrival || departure.stop_sequence >= arrival.stop_sequence) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid departure/arrival segment for this trip.",
        });
      }

      if (!seat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Seat not found." });
      }

      try {
        return await ctx.db.reservation.create({
          data: {
            user_id: ctx.session.user.id,
            seat_id: input.seat_id,
            trip_id: input.trip_id,
            dep_stop_id: input.dep_stop_id,
            arriv_stop_id: input.arriv_stop_id,
            price: input.price,
            departure_time: input.departure_time,
            arrival_time: input.arrival_time,
          },
        });
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This seat is no longer available for the selected trip.",
        });
      }
    }),
});

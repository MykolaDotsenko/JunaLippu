import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  calculateJourneyPrice,
  minutesToDuration,
  timeToMinutes,
} from "~/server/api/lib/journey";
import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const bookingInput = z.object({
  seat_id: z.number().int(),
  trip_id: z.string().min(1),
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
  travel_class: z.number().int().min(1).max(2),
});

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const getBookingContext = async (
  ctx: TRPCContext,
  input: z.infer<typeof bookingInput>,
) => {
  const trip = await ctx.db.trip.findUnique({
    where: { trip_id: input.trip_id },
    include: {
      route: {
        include: {
          train: {
            include: {
              composition: {
                select: { car_id: true },
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

  const [departure, arrival, seat, departureStop, arrivalStop] =
    await Promise.all([
      ctx.db.stop_time.findFirst({
        where: { trip_id: input.trip_id, stop_id: input.dep_stop_id },
        select: {
          stop_sequence: true,
          departure_time: true,
        },
      }),
      ctx.db.stop_time.findFirst({
        where: { trip_id: input.trip_id, stop_id: input.arriv_stop_id },
        select: {
          stop_sequence: true,
          arrival_time: true,
        },
      }),
      ctx.db.seat.findUnique({
        where: { seat_id: input.seat_id },
        include: { car: true },
      }),
      ctx.db.stop.findUnique({
        where: { stop_id: input.dep_stop_id },
        select: { stop_name: true },
      }),
      ctx.db.stop.findUnique({
        where: { stop_id: input.arriv_stop_id },
        select: { stop_name: true },
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

  const tripCarIds = new Set(
    trip.route.train.composition.map((composition) => composition.car_id),
  );

  if (!tripCarIds.has(seat.car_id) || seat.travel_class !== input.travel_class) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The selected seat does not belong to this trip and class.",
    });
  }

  const durationMinutes =
    timeToMinutes(arrival.arrival_time) -
    timeToMinutes(departure.departure_time);

  if (durationMinutes < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid journey duration.",
    });
  }

  const composition = await ctx.db.train_composition.findUnique({
    where: { car_id: seat.car_id },
    select: { car_number: true },
  });

  return {
    trip,
    seat,
    departure,
    arrival,
    departureStop,
    arrivalStop,
    durationMinutes,
    carNumber: composition?.car_number ?? seat.car_id,
    price: calculateJourneyPrice(durationMinutes, input.travel_class),
  };
};

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
        .sort(
          (a, b) =>
            a.car_number - b.car_number || a.seat_number - b.seat_number,
        );
    }),

  getReview: publicProcedure
    .input(bookingInput)
    .query(async ({ input, ctx }) => {
      const data = await getBookingContext(ctx, input);

      return {
        trip_id: input.trip_id,
        train_number: data.trip.route.train.train_number,
        departure_stop_name:
          data.departureStop?.stop_name ?? input.dep_stop_id,
        arrival_stop_name: data.arrivalStop?.stop_name ?? input.arriv_stop_id,
        departure_time: data.departure.departure_time,
        arrival_time: data.arrival.arrival_time,
        duration: minutesToDuration(data.durationMinutes),
        travel_class: input.travel_class,
        car_number: data.carNumber,
        seat_number: data.seat.seat_number,
        price: data.price,
      };
    }),

  createReservation: protectedProcedure
    .input(bookingInput)
    .mutation(async ({ input, ctx }) => {
      const data = await getBookingContext(ctx, input);

      try {
        return await ctx.db.reservation.create({
          data: {
            user_id: ctx.session.user.id,
            seat_id: input.seat_id,
            trip_id: input.trip_id,
            dep_stop_id: input.dep_stop_id,
            arriv_stop_id: input.arriv_stop_id,
            price: data.price,
            departure_time: data.departure.departure_time,
            arrival_time: data.arrival.arrival_time,
          },
        });
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This seat is no longer available. Choose another seat.",
        });
      }
    }),

  getReservation: protectedProcedure
    .input(z.object({ reservation_id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const reservation = await ctx.db.reservation.findFirst({
        where: {
          reservation_id: input.reservation_id,
          user_id: ctx.session.user.id,
        },
        include: {
          departure_stop: { select: { stop_name: true } },
          arrival_stop: { select: { stop_name: true } },
          seat: {
            include: {
              car: true,
            },
          },
          trip: {
            include: {
              route: {
                include: {
                  train: true,
                },
              },
            },
          },
        },
      });

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found.",
        });
      }

      const composition = await ctx.db.train_composition.findUnique({
        where: { car_id: reservation.seat.car_id },
        select: { car_number: true },
      });

      return {
        reservation_id: reservation.reservation_id,
        departure_stop_name: reservation.departure_stop.stop_name,
        arrival_stop_name: reservation.arrival_stop.stop_name,
        departure_time: reservation.departure_time,
        arrival_time: reservation.arrival_time,
        train_number: reservation.trip.route.train.train_number,
        car_number: composition?.car_number ?? reservation.seat.car_id,
        seat_number: reservation.seat.seat_number,
        travel_class: reservation.seat.travel_class,
        price: reservation.price,
      };
    }),
});

import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  minutesToDuration,
  timeToMinutes,
} from "~/server/api/lib/journey";
import {
  type createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const travelClassSchema = z.union([z.literal(1), z.literal(2)]);

const segmentInput = z.object({
  trip_id: z.string().min(1),
  dep_stop_id: z.string().min(1),
  arriv_stop_id: z.string().min(1),
});

const bookingInput = segmentInput.extend({
  seat_id: z.number().int().positive(),
  travel_class: travelClassSchema,
});

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const getJourneySegment = async (
  ctx: TRPCContext,
  input: z.infer<typeof segmentInput>,
) => {
  const trip = await ctx.db.trip.findUnique({
    where: { trip_id: input.trip_id },
    select: {
      trip_id: true,
      service_date: true,
      route: {
        select: {
          train_id: true,
          train: {
            select: {
              train_number: true,
              composition: {
                select: {
                  car_id: true,
                  car_number: true,
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

  const [departure, arrival, departureStop, arrivalStop] = await Promise.all([
    ctx.db.stop_time.findFirst({
      where: { trip_id: input.trip_id, stop_id: input.dep_stop_id },
      select: { stop_sequence: true, departure_time: true },
    }),
    ctx.db.stop_time.findFirst({
      where: { trip_id: input.trip_id, stop_id: input.arriv_stop_id },
      select: { stop_sequence: true, arrival_time: true },
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

  if (
    !departure ||
    !arrival ||
    !departureStop ||
    !arrivalStop ||
    departure.stop_sequence >= arrival.stop_sequence
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid departure/arrival segment for this trip.",
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

  const segmentSequences = Array.from(
    { length: arrival.stop_sequence - departure.stop_sequence },
    (_, index) => departure.stop_sequence + index,
  );

  return {
    trip,
    departure,
    arrival,
    departureStop,
    arrivalStop,
    durationMinutes,
    segmentSequences,
  };
};

const getSeatContext = async (
  ctx: TRPCContext,
  input: z.infer<typeof bookingInput>,
) => {
  const segment = await getJourneySegment(ctx, input);

  const seat = await ctx.db.seat.findUnique({
    where: { seat_id: input.seat_id },
    select: {
      seat_id: true,
      seat_number: true,
      car_id: true,
      travel_class: true,
    },
  });

  if (!seat) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Seat not found." });
  }

  const composition = segment.trip.route.train.composition.find(
    (item) => item.car_id === seat.car_id,
  );

  if (!composition || seat.travel_class !== input.travel_class) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The selected seat does not belong to this trip and class.",
    });
  }

  const overlappingSegment = await ctx.db.reservationSegment.findFirst({
    where: {
      trip_id: input.trip_id,
      seat_id: input.seat_id,
      stop_sequence: { in: segment.segmentSequences },
    },
    select: { reservation_id: true },
  });

  return {
    ...segment,
    seat,
    carNumber: composition.car_number,
    isAvailable: !overlappingSegment,
    priceCents: calculateJourneyPriceCents(
      segment.durationMinutes,
      input.travel_class,
    ),
  };
};

export const bookingRouter = createTRPCRouter({
  getJourneyDetails: publicProcedure
    .input(segmentInput)
    .query(async ({ input, ctx }) => {
      const segment = await getJourneySegment(ctx, input);

      return {
        trip_id: segment.trip.trip_id,
        service_date: segment.trip.service_date,
        train_number: segment.trip.route.train.train_number,
        departure_stop_name: segment.departureStop.stop_name,
        arrival_stop_name: segment.arrivalStop.stop_name,
        departure_time: segment.departure.departure_time,
        arrival_time: segment.arrival.arrival_time,
        duration: minutesToDuration(segment.durationMinutes),
      };
    }),

  getSeat: publicProcedure
    .input(segmentInput.extend({ travel_class: travelClassSchema }))
    .query(async ({ input, ctx }) => {
      const segment = await getJourneySegment(ctx, input);
      const occupied = await ctx.db.reservationSegment.findMany({
        where: {
          trip_id: input.trip_id,
          stop_sequence: { in: segment.segmentSequences },
        },
        select: { seat_id: true },
        distinct: ["seat_id"],
      });

      const occupiedSeatIds = new Set(occupied.map((item) => item.seat_id));
      const tripCarIds = segment.trip.route.train.composition.map(
        (item) => item.car_id,
      );

      const seats = await ctx.db.seat.findMany({
        where: {
          car_id: { in: tripCarIds },
          travel_class: input.travel_class,
        },
        select: {
          seat_id: true,
          seat_number: true,
          car_id: true,
        },
      });

      const carNumberById = new Map(
        segment.trip.route.train.composition.map((item) => [
          item.car_id,
          item.car_number,
        ]),
      );

      return seats
        .filter((seat) => !occupiedSeatIds.has(seat.seat_id))
        .map((seat) => ({
          seat_id: seat.seat_id,
          seat_number: seat.seat_number,
          car_id: seat.car_id,
          car_number: carNumberById.get(seat.car_id) ?? seat.car_id,
          train_id: segment.trip.route.train_id,
          train_number: segment.trip.route.train.train_number,
        }))
        .sort(
          (a, b) =>
            a.car_number - b.car_number || a.seat_number - b.seat_number,
        );
    }),

  getReview: publicProcedure
    .input(bookingInput)
    .query(async ({ input, ctx }) => {
      const data = await getSeatContext(ctx, input);

      if (!data.isAvailable) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This seat was just booked. Choose another seat.",
        });
      }

      return {
        trip_id: input.trip_id,
        service_date: data.trip.service_date,
        train_number: data.trip.route.train.train_number,
        departure_stop_name: data.departureStop.stop_name,
        arrival_stop_name: data.arrivalStop.stop_name,
        departure_time: data.departure.departure_time,
        arrival_time: data.arrival.arrival_time,
        duration: minutesToDuration(data.durationMinutes),
        travel_class: input.travel_class,
        car_number: data.carNumber,
        seat_number: data.seat.seat_number,
        price: centsToEuros(data.priceCents),
      };
    }),

  createReservation: protectedProcedure
    .input(bookingInput)
    .mutation(async ({ input, ctx }) => {
      const data = await getSeatContext(ctx, input);

      if (!data.isAvailable) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This seat is no longer available. Choose another seat.",
        });
      }

      try {
        return await ctx.db.reservation.create({
          data: {
            user_id: ctx.session.user.id,
            seat_id: input.seat_id,
            trip_id: input.trip_id,
            dep_stop_id: input.dep_stop_id,
            arriv_stop_id: input.arriv_stop_id,
            price_cents: data.priceCents,
            departure_time: data.departure.departure_time,
            arrival_time: data.arrival.arrival_time,
            segments: {
              create: data.segmentSequences.map((stopSequence) => ({
                trip_id: input.trip_id,
                seat_id: input.seat_id,
                stop_sequence: stopSequence,
              })),
            },
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This seat is no longer available. Choose another seat.",
          });
        }
        throw error;
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
          seat: true,
          trip: {
            include: {
              route: {
                include: {
                  train: {
                    include: {
                      composition: {
                        select: {
                          car_id: true,
                          car_number: true,
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

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found.",
        });
      }

      const carNumber =
        reservation.trip.route.train.composition.find(
          (item) => item.car_id === reservation.seat.car_id,
        )?.car_number ?? reservation.seat.car_id;

      return {
        reservation_id: reservation.reservation_id,
        service_date: reservation.trip.service_date,
        departure_stop_name: reservation.departure_stop.stop_name,
        arrival_stop_name: reservation.arrival_stop.stop_name,
        departure_time: reservation.departure_time,
        arrival_time: reservation.arrival_time,
        train_number: reservation.trip.route.train.train_number,
        car_number: carNumber,
        seat_number: reservation.seat.seat_number,
        travel_class: reservation.seat.travel_class,
        price: centsToEuros(reservation.price_cents),
      };
    }),
});

import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  calculateJourneyPriceCents,
  centsToEuros,
  journeyDurationMinutes,
  minutesToDuration,
  pickJourneyStops,
  segmentSequences,
} from "~/server/api/lib/journey";
import {
  type createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const travelClassSchema = z.union([z.literal(1), z.literal(2)]);

const segmentShape = {
  trip_id: z.string().min(1),
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

const segmentInput = z
  .object(segmentShape)
  .refine(hasDistinctStops, distinctStopsError);

const classSegmentInput = z
  .object({ ...segmentShape, travel_class: travelClassSchema })
  .refine(hasDistinctStops, distinctStopsError);

const bookingInput = z
  .object({
    ...segmentShape,
    seat_id: z.number().int().positive(),
    travel_class: travelClassSchema,
  })
  .refine(hasDistinctStops, distinctStopsError);

type SegmentInput = z.infer<typeof segmentInput>;
type BookingInput = z.infer<typeof bookingInput>;

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const getJourneySegment = async (ctx: TRPCContext, input: SegmentInput) => {
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

  const [calls, departureStop, arrivalStop] = await Promise.all([
    ctx.db.stop_time.findMany({
      where: {
        trip_id: input.trip_id,
        stop_id: { in: [input.dep_stop_id, input.arriv_stop_id] },
      },
      select: {
        stop_id: true,
        stop_sequence: true,
        arrival_time: true,
        departure_time: true,
      },
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

  const journey = pickJourneyStops(
    calls.filter((call) => call.stop_id === input.dep_stop_id),
    calls.filter((call) => call.stop_id === input.arriv_stop_id),
  );

  if (!journey || !departureStop || !arrivalStop) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid departure/arrival segment for this trip.",
    });
  }

  const { departure, arrival } = journey;
  const durationMinutes = journeyDurationMinutes(
    departure.departure_time,
    arrival.arrival_time,
  );

  if (durationMinutes === null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid journey duration.",
    });
  }

  return {
    trip,
    departure,
    arrival,
    departureStop,
    arrivalStop,
    durationMinutes,
    segmentSequences: segmentSequences(
      departure.stop_sequence,
      arrival.stop_sequence,
    ),
  };
};

const getSeatContext = async (ctx: TRPCContext, input: BookingInput) => {
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

const reservationInclude = {
  departure_stop: { select: { stop_name: true } },
  arrival_stop: { select: { stop_name: true } },
  seat: { select: { seat_number: true, car_id: true, travel_class: true } },
  trip: {
    select: {
      service_date: true,
      route: {
        select: {
          train: {
            select: {
              train_number: true,
              composition: {
                select: { car_id: true, car_number: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ReservationInclude;

type ReservationRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

const toReservationSummary = (reservation: ReservationRecord) => {
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
};

export const bookingRouter = createTRPCRouter({
  getQuote: publicProcedure
    .input(classSegmentInput)
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
        travel_class: input.travel_class,
        price: centsToEuros(
          calculateJourneyPriceCents(
            segment.durationMinutes,
            input.travel_class,
          ),
        ),
      };
    }),

  getSeat: publicProcedure
    .input(classSegmentInput)
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
        include: reservationInclude,
      });

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found.",
        });
      }

      return toReservationSummary(reservation);
    }),

  listReservations: protectedProcedure
    .input(
      z
        .object({
          limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_PAGE_SIZE)
            .default(DEFAULT_PAGE_SIZE),
          cursor: z.number().int().positive().nullish(),
        })
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const rows = await ctx.db.reservation.findMany({
        where: { user_id: ctx.session.user.id },
        orderBy: { reservation_id: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { reservation_id: input.cursor } } : {}),
        include: reservationInclude,
      });

      let nextCursor: number | null = null;
      if (rows.length > input.limit) {
        nextCursor = rows.pop()?.reservation_id ?? null;
      }

      return {
        items: rows.map(toReservationSummary),
        nextCursor,
      };
    }),
});

import { db } from "../../src/server/db";

const assertTestDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isolated =
    process.env.NODE_ENV === "test" &&
    process.env.JUNALIPPU_TEST_DB === "1" &&
    databaseUrl.startsWith("file:") &&
    databaseUrl.includes("junalippu-test-");

  if (!isolated) {
    throw new Error(
      "Refusing to wipe the database: this suite requires the isolated " +
        "temporary database created by the repository test runner.",
    );
  }
};

export const resetDatabase = async () => {
  assertTestDatabase();
  await db.reservationSegment.deleteMany();
  await db.reservation.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
  await db.stop_time.deleteMany();
  await db.trip.deleteMany();
  await db.route.deleteMany();
  await db.train_composition.deleteMany();
  await db.seat.deleteMany();
  await db.car.deleteMany();
  await db.train.deleteMany();
  await db.stop.deleteMany();
  await db.calendar.deleteMany();
};

export const createCalendar = (serviceId: string) =>
  db.calendar.create({
    data: {
      service_id: serviceId,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  });

export const createStops = async (stops: { id: string; name: string }[]) => {
  for (const stop of stops) {
    await db.stop.create({ data: { stop_id: stop.id, stop_name: stop.name } });
  }
};

type SeatFixture = { seatId: number; seatNumber: number; travelClass: 1 | 2 };
type CarFixture = { carId: number; carNumber: number; seats: SeatFixture[] };

export const createTrain = async (options: {
  trainId: number;
  trainNumber: string;
  routeId: string;
  cars: CarFixture[];
}) => {
  await db.train.create({
    data: { train_id: options.trainId, train_number: options.trainNumber },
  });

  for (const car of options.cars) {
    await db.car.create({ data: { car_id: car.carId } });
    await db.train_composition.create({
      data: {
        train_id: options.trainId,
        car_id: car.carId,
        car_number: car.carNumber,
      },
    });
    for (const seat of car.seats) {
      await db.seat.create({
        data: {
          seat_id: seat.seatId,
          seat_number: seat.seatNumber,
          car_id: car.carId,
          travel_class: seat.travelClass,
        },
      });
    }
  }

  await db.route.create({
    data: {
      route_id: options.routeId,
      route_long_name: options.trainNumber,
      train_id: options.trainId,
    },
  });
};

export type CallFixture = {
  stopId: string;
  arrival: string;
  departure: string;
  sequence: number;
};

export const createTrip = async (options: {
  tripId: string;
  routeId: string;
  serviceId: string;
  serviceDate: string;
  calls: CallFixture[];
}) => {
  await db.trip.create({
    data: {
      trip_id: options.tripId,
      route_id: options.routeId,
      service_id: options.serviceId,
      service_date: options.serviceDate,
    },
  });

  for (const call of options.calls) {
    await db.stop_time.create({
      data: {
        trip_id: options.tripId,
        stop_id: call.stopId,
        arrival_time: call.arrival,
        departure_time: call.departure,
        stop_sequence: call.sequence,
      },
    });
  }
};

export const passingCall = (
  stopId: string,
  time: string,
  sequence: number,
): CallFixture => ({
  stopId,
  arrival: time,
  departure: time,
  sequence,
});

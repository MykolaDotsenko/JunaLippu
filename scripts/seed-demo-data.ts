import { PrismaClient } from "@prisma/client";

import { readCsvRows } from "./lib/csv";

const db = new PrismaClient();
const prismaFile = (name: string) => new URL(`../prisma/${name}`, import.meta.url);

const asInteger = (value: string | undefined, field: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Invalid integer for ${field}: ${value ?? "<missing>"}`);
  }
  return parsed;
};

const asBoolean = (value: string | undefined, field: string) => {
  if (value === "1") return true;
  if (value === "0") return false;
  throw new Error(`Invalid boolean for ${field}: ${value ?? "<missing>"}`);
};

const trains = readCsvRows(prismaFile("1_Train.csv")).map(
  ([trainId, trainNumber]) => ({
    train_id: asInteger(trainId, "Train.train_id"),
    train_number: trainNumber ?? "",
  }),
);

const cars = readCsvRows(prismaFile("2_Car.csv")).map(([carId]) => ({
  car_id: asInteger(carId, "Car.car_id"),
}));

const seats = readCsvRows(prismaFile("3_Seat.csv")).map(
  ([seatId, seatNumber, _legacyAvailability, carId, travelClass]) => ({
    seat_id: asInteger(seatId, "Seat.seat_id"),
    seat_number: asInteger(seatNumber, "Seat.seat_number"),
    car_id: asInteger(carId, "Seat.car_id"),
    travel_class: asInteger(travelClass, "Seat.travel_class"),
  }),
);

const compositions = readCsvRows(prismaFile("4_Train_composition.csv")).map(
  ([trainId, carId, carNumber]) => ({
    train_id: asInteger(trainId, "Train_composition.train_id"),
    car_id: asInteger(carId, "Train_composition.car_id"),
    car_number: asInteger(carNumber, "Train_composition.car_number"),
  }),
);

const trips = readCsvRows(prismaFile("5_Trip.csv")).map(
  ([tripId, routeId, serviceId, serviceDate]) => ({
    trip_id: tripId ?? "",
    route_id: routeId ?? "",
    service_id: serviceId ?? "",
    service_date: serviceDate ?? "",
  }),
);

const routes = readCsvRows(prismaFile("6_Route.csv")).map(
  ([routeId, routeLongName, trainId]) => ({
    route_id: routeId ?? "",
    route_long_name: routeLongName ?? "",
    train_id: asInteger(trainId, "Route.train_id"),
  }),
);

const stopTimes = readCsvRows(prismaFile("7_Stop_time.csv")).map(
  ([stopId, tripId, arrivalTime, departureTime, stopSequence]) => ({
    stop_id: stopId ?? "",
    trip_id: tripId ?? "",
    arrival_time: arrivalTime ?? "",
    departure_time: departureTime ?? "",
    stop_sequence: asInteger(stopSequence, "Stop_time.stop_sequence"),
  }),
);

const stops = readCsvRows(prismaFile("8_Stop.csv")).map(
  ([stopId, stopName]) => ({
    stop_id: stopId ?? "",
    stop_name: stopName ?? "",
  }),
);

const calendars = readCsvRows(prismaFile("9_Calendar.csv")).map(
  ([
    serviceId,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  ]) => ({
    service_id: serviceId ?? "",
    monday: asBoolean(monday, "Calendar.monday"),
    tuesday: asBoolean(tuesday, "Calendar.tuesday"),
    wednesday: asBoolean(wednesday, "Calendar.wednesday"),
    thursday: asBoolean(thursday, "Calendar.thursday"),
    friday: asBoolean(friday, "Calendar.friday"),
    saturday: asBoolean(saturday, "Calendar.saturday"),
    sunday: asBoolean(sunday, "Calendar.sunday"),
  }),
);

const expectedCounts = {
  train: trains.length,
  car: cars.length,
  seat: seats.length,
  composition: compositions.length,
  route: routes.length,
  calendar: calendars.length,
  trip: trips.length,
  stop: stops.length,
  stopTime: stopTimes.length,
};

const currentCounts = async () => ({
  train: await db.train.count(),
  car: await db.car.count(),
  seat: await db.seat.count(),
  composition: await db.train_composition.count(),
  route: await db.route.count(),
  calendar: await db.calendar.count(),
  trip: await db.trip.count(),
  stop: await db.stop.count(),
  stopTime: await db.stop_time.count(),
});

const insertInChunks = async <T>(
  rows: readonly T[],
  insert: (chunk: T[]) => Promise<unknown>,
) => {
  const chunkSize = 100;
  for (let index = 0; index < rows.length; index += chunkSize) {
    await insert(rows.slice(index, index + chunkSize));
  }
};

try {
  const before = await currentCounts();
  const domainRows = Object.values(before).reduce((sum, count) => sum + count, 0);

  if (domainRows > 0) {
    if (JSON.stringify(before) === JSON.stringify(expectedCounts)) {
      console.log("Demo timetable is already loaded; nothing to seed.");
      process.exitCode = 0;
    } else {
      throw new Error(
        "Refusing to seed a non-empty or partially populated railway database. " +
          "Use a fresh database or keep the existing data unchanged.",
      );
    }
  } else {
    await db.$transaction(
      async (tx) => {
        await insertInChunks(trains, (data) => tx.train.createMany({ data }));
        await insertInChunks(cars, (data) => tx.car.createMany({ data }));
        await insertInChunks(seats, (data) => tx.seat.createMany({ data }));
        await insertInChunks(compositions, (data) =>
          tx.train_composition.createMany({ data }),
        );
        await insertInChunks(routes, (data) => tx.route.createMany({ data }));
        await insertInChunks(calendars, (data) =>
          tx.calendar.createMany({ data }),
        );
        await insertInChunks(trips, (data) => tx.trip.createMany({ data }));
        await insertInChunks(stops, (data) => tx.stop.createMany({ data }));
        await insertInChunks(stopTimes, (data) =>
          tx.stop_time.createMany({ data }),
        );
      },
      { maxWait: 10_000, timeout: 120_000 },
    );

    const after = await currentCounts();
    if (JSON.stringify(after) !== JSON.stringify(expectedCounts)) {
      throw new Error(
        `Demo seed verification failed. Expected ${JSON.stringify(
          expectedCounts,
        )}, received ${JSON.stringify(after)}.`,
      );
    }

    console.log(
      `Loaded ${after.trip} trips, ${after.stop} stations and ${after.stopTime} stop calls.`,
    );
  }
} finally {
  await db.$disconnect();
}

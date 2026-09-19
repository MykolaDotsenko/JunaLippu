import { PrismaClient } from "@prisma/client";

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

assertTestDatabase();

const db = new PrismaClient();

const reset = async () => {
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

const createTrainJourney = async ({
  id,
  trainNumber,
  routeId,
  tripId,
  serviceDate,
  stops,
  seats = [{ id: id * 10, number: 1 }],
}) => {
  await db.train.create({ data: { train_id: id, train_number: trainNumber } });
  await db.car.create({ data: { car_id: id } });

  for (const seat of seats) {
    await db.seat.create({
      data: {
        seat_id: seat.id,
        seat_number: seat.number,
        car_id: id,
        travel_class: 2,
      },
    });
  }

  await db.train_composition.create({
    data: { train_id: id, car_id: id, car_number: 1 },
  });
  await db.route.create({
    data: { route_id: routeId, route_long_name: routeId, train_id: id },
  });
  await db.trip.create({
    data: {
      trip_id: tripId,
      route_id: routeId,
      service_id: "e2e-service",
      service_date: serviceDate,
    },
  });

  for (const [sequence, stop] of stops.entries()) {
    await db.stop_time.create({
      data: {
        trip_id: tripId,
        stop_id: stop.id,
        arrival_time: stop.arrival ?? stop.departure,
        departure_time: stop.departure,
        stop_sequence: sequence,
      },
    });
  }
};

try {
  await reset();

  await db.calendar.create({
    data: {
      service_id: "e2e-service",
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
  });

  const stops = [
    ["E2EA", "Alpha"],
    ["E2EB", "Beta"],
    ["E2EC", "Gamma"],
    ["IMR", "Imatra"],
    ["LR_0", "Lappeenranta"],
    ["TPE", "Tampere"],
    ["JY", "Jyväskylä"],
  ];

  await db.stop.createMany({
    data: stops.map(([stop_id, stop_name]) => ({ stop_id, stop_name })),
  });

  await createTrainJourney({
    id: 901,
    trainNumber: "IC901",
    routeId: "e2e-route",
    tripId: "e2e-trip",
    serviceDate: "2024-05-06",
    seats: [
      { id: 901, number: 7 },
      { id: 902, number: 8 },
    ],
    stops: [
      { id: "E2EA", departure: "07:25:00" },
      { id: "E2EB", arrival: "08:20:00", departure: "08:25:00" },
      { id: "E2EC", departure: "09:26:00" },
    ],
  });

  await createTrainJourney({
    id: 910,
    trainNumber: "IC910",
    routeId: "imatra-lappeenranta",
    tripId: "e2e-imatra-lappeenranta",
    serviceDate: "2024-06-01",
    stops: [
      { id: "IMR", departure: "7:04:15" },
      { id: "LR_0", departure: "7:52:45" },
    ],
  });

  await createTrainJourney({
    id: 920,
    trainNumber: "IC920",
    routeId: "tampere-jyvaskyla",
    tripId: "e2e-tampere-jyvaskyla",
    serviceDate: "2024-07-01",
    stops: [
      { id: "TPE", departure: "9:15:00" },
      { id: "JY", departure: "11:01:30" },
    ],
  });
} finally {
  await db.$disconnect();
}

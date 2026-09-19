import { PrismaClient } from "@prisma/client";

const assertTestDatabase = () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Refusing to wipe the database: NODE_ENV is not 'test'. These helpers " +
        "delete every row in the database named by DATABASE_URL, which in a " +
        "normal setup is your development data. Run the pnpm test scripts, " +
        "which set NODE_ENV for you.",
    );
  }
};

assertTestDatabase();

const db = new PrismaClient();

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

await db.train.create({ data: { train_id: 901, train_number: "IC901" } });
await db.car.create({ data: { car_id: 901 } });
await db.seat.create({
  data: { seat_id: 901, seat_number: 7, car_id: 901, travel_class: 2 },
});
await db.seat.create({
  data: { seat_id: 902, seat_number: 8, car_id: 901, travel_class: 2 },
});
await db.train_composition.create({
  data: { train_id: 901, car_id: 901, car_number: 1 },
});
await db.route.create({
  data: {
    route_id: "e2e-route",
    route_long_name: "Alpha–Gamma",
    train_id: 901,
  },
});
await db.trip.create({
  data: {
    trip_id: "e2e-trip",
    route_id: "e2e-route",
    service_id: "e2e-service",
    service_date: "2024-05-06",
  },
});

await Promise.all([
  db.stop.create({ data: { stop_id: "E2EA", stop_name: "Alpha" } }),
  db.stop.create({ data: { stop_id: "E2EB", stop_name: "Beta" } }),
  db.stop.create({ data: { stop_id: "E2EC", stop_name: "Gamma" } }),
]);

await Promise.all([
  db.stop_time.create({
    data: {
      trip_id: "e2e-trip",
      stop_id: "E2EA",
      arrival_time: "07:25:00",
      departure_time: "07:25:00",
      stop_sequence: 0,
    },
  }),
  db.stop_time.create({
    data: {
      trip_id: "e2e-trip",
      stop_id: "E2EB",
      arrival_time: "08:20:00",
      departure_time: "08:25:00",
      stop_sequence: 1,
    },
  }),
  db.stop_time.create({
    data: {
      trip_id: "e2e-trip",
      stop_id: "E2EC",
      arrival_time: "09:26:00",
      departure_time: "09:26:00",
      stop_sequence: 2,
    },
  }),
]);

await db.$disconnect();

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reservation" (
    "reservation_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seat_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "dep_stop_id" TEXT NOT NULL,
    "arriv_stop_id" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "departure_time" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    CONSTRAINT "Reservation_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "Seat" ("seat_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip" ("trip_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_dep_stop_id_fkey" FOREIGN KEY ("dep_stop_id") REFERENCES "Stop" ("stop_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_arriv_stop_id_fkey" FOREIGN KEY ("arriv_stop_id") REFERENCES "Stop" ("stop_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReservationSegment" (
    "reservation_id" INTEGER NOT NULL,
    "trip_id" TEXT NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "stop_sequence" INTEGER NOT NULL,

    PRIMARY KEY ("reservation_id", "stop_sequence"),
    CONSTRAINT "ReservationSegment_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation" ("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Train" (
    "train_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "train_number" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Car" (
    "car_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "Seat" (
    "seat_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seat_number" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "travel_class" INTEGER NOT NULL,
    CONSTRAINT "Seat_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car" ("car_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Train_composition" (
    "train_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "car_number" INTEGER NOT NULL,

    PRIMARY KEY ("train_id", "car_id"),
    CONSTRAINT "Train_composition_train_id_fkey" FOREIGN KEY ("train_id") REFERENCES "Train" ("train_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Train_composition_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car" ("car_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "trip_id" TEXT NOT NULL PRIMARY KEY,
    "route_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_date" TEXT NOT NULL,
    CONSTRAINT "Trip_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route" ("route_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Calendar" ("service_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Route" (
    "route_id" TEXT NOT NULL PRIMARY KEY,
    "route_long_name" TEXT NOT NULL,
    "train_id" INTEGER NOT NULL,
    CONSTRAINT "Route_train_id_fkey" FOREIGN KEY ("train_id") REFERENCES "Train" ("train_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stop_time" (
    "stop_id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "stop_sequence" INTEGER NOT NULL,

    PRIMARY KEY ("stop_id", "trip_id", "stop_sequence"),
    CONSTRAINT "Stop_time_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "Stop" ("stop_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stop_time_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip" ("trip_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stop" (
    "stop_id" TEXT NOT NULL PRIMARY KEY,
    "stop_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Calendar" (
    "service_id" TEXT NOT NULL PRIMARY KEY,
    "monday" BOOLEAN NOT NULL,
    "tuesday" BOOLEAN NOT NULL,
    "wednesday" BOOLEAN NOT NULL,
    "thursday" BOOLEAN NOT NULL,
    "friday" BOOLEAN NOT NULL,
    "saturday" BOOLEAN NOT NULL,
    "sunday" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Reservation_user_id_idx" ON "Reservation"("user_id");

-- CreateIndex
CREATE INDEX "Reservation_trip_id_seat_id_idx" ON "Reservation"("trip_id", "seat_id");

-- CreateIndex
CREATE INDEX "ReservationSegment_trip_id_seat_id_idx" ON "ReservationSegment"("trip_id", "seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSegment_trip_id_seat_id_stop_sequence_key" ON "ReservationSegment"("trip_id", "seat_id", "stop_sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Train_composition_car_id_key" ON "Train_composition"("car_id");

-- CreateIndex
CREATE INDEX "Trip_service_date_idx" ON "Trip"("service_date");

-- CreateIndex
CREATE UNIQUE INDEX "Route_train_id_key" ON "Route"("train_id");

-- CreateIndex
CREATE INDEX "Stop_time_trip_id_stop_sequence_idx" ON "Stop_time"("trip_id", "stop_sequence");


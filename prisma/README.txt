Before seeding:

1) Run command: pnpm prisma db push - this creates a database according to a schema
2) Run command: pnpm prisma generate - this generates Prisma Client for interaction with database
3) Run command: pnpm prisma studio - this opens Prisma Studio to see data
4) Check in prisma studio that you have all tables mentioned in prisma.schema (they are empty)
5) To populate tables with data follow seeding instruction below. 

Seeding instructions:

1) Make sure you have installed sqlite3.

2) Open a command prompt. Set directory to prisma folder inside junalippu project.

The next actions are inside Command prompt:

    - Run sqlite3 command;
    - To open a database run a command: .open db.sqlite
    - Run command: .mode csv 

    - Run the following commands one by one:

.import path\prisma\1_Train.csv Train
.import path\prisma\2_Car.csv Car
.import path\prisma\3_Seat.csv Seat
.import path\prisma\4_Train_composition.csv Train_composition
.import path\prisma\5_Trip.csv Trip
.import path\prisma\6_Route.csv Route
.import path\prisma\7_Stop_time.csv Stop_time
.import path\prisma\8_Stop.csv Stop
.import path\prisma\9_Calendar.csv Calendar

4) After that you should be able to see data in Prisma Studio.

5) Some table are initially empty, that is normal. They will be filled by user interaction with an application.
import { bookingRouter } from "~/server/api/routers/booking";
import { searchRouter } from "~/server/api/routers/search";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  search: searchRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

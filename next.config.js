/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

const legacyRouteRedirects = async () => [
  { source: "/MainPage", destination: "/", permanent: true },
  { source: "/BookingJourney", destination: "/trains", permanent: true },
  { source: "/Journey", destination: "/seats", permanent: true },
  { source: "/ReviewBooking", destination: "/review", permanent: true },
  { source: "/BookingSuccess", destination: "/confirmation", permanent: true },
];

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  redirects: legacyRouteRedirects,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

export default config;

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

const isProduction = process.env.NODE_ENV === "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isProduction ? "" : " ws: wss: http: https:"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  redirects: legacyRouteRedirects,

  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

export default config;

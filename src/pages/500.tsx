import React from "react";
import Link from "next/link";

import PageLayout from "~/components/PageLayout";

const ServerErrorPage = () => (
  <PageLayout title="Something went wrong · JunaLippu" width="sm">
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-500">
        Error 500
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-red-900">
        Something went wrong on our side.
      </h1>
      <p className="mt-3 text-red-800">
        We could not confirm the result of your last action. If you just
        reserved a seat, check My bookings before trying again.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Link
          href="/bookings"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-300 bg-white px-6 font-semibold text-red-900 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
        >
          Check My bookings
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Back to search
        </Link>
      </div>
    </div>
  </PageLayout>
);

export default ServerErrorPage;

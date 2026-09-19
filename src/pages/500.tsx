import React from "react";
import Link from "next/link";

import PageLayout from "~/components/PageLayout";

const ServerErrorPage: React.FC = () => (
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
        No reservation was created. Please try again in a moment.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Back to search
      </Link>
    </div>
  </PageLayout>
);

export default ServerErrorPage;

import React from "react";
import Link from "next/link";

import PageLayout from "~/components/PageLayout";

const NotFoundPage: React.FC = () => (
  <PageLayout title="Page not found · JunaLippu" width="sm">
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        This page does not exist.
      </h1>
      <p className="mt-3 text-slate-500">
        The link may be outdated. Start a new search to book a journey.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Back to search
      </Link>
    </div>
  </PageLayout>
);

export default NotFoundPage;

import React from "react";
import Link from "next/link";

const routes = [
  { from: "HKI", to: "TPE", label: "Helsinki → Tampere" },
  { from: "HKI", to: "OL", label: "Helsinki → Oulu" },
];

const PopularRoutes: React.FC = () => (
  <section className="py-12 sm:py-16" aria-labelledby="popular-routes-title">
    <div className="mb-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Quick start</p>
      <h2 id="popular-routes-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        Popular demo routes
      </h2>
      <p className="mt-2 text-slate-600">Prefill a route, then choose an available service date.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      {routes.map((route) => (
        <Link
          key={route.label}
          href={{ pathname: "/", query: { from: route.from, to: route.to } }}
          className="group flex min-h-24 items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <div>
            <div className="font-semibold text-slate-950">{route.label}</div>
            <div className="mt-1 text-sm text-slate-500">1 passenger · one way</div>
          </div>
          <span className="text-xl text-blue-600 transition group-hover:translate-x-1">→</span>
        </Link>
      ))}
    </div>
  </section>
);

export default PopularRoutes;

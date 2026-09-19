import Image from "next/image";

const RailExperience = () => (
  <section className="pb-12 sm:pb-16" aria-labelledby="rail-experience-title">
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="group relative min-h-[360px] overflow-hidden rounded-3xl bg-slate-950 shadow-lg sm:min-h-[420px]">
        <Image
          src="/images/santa-claus-express-masthead.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">
            Original project visual · modernized
          </p>
          <h2
            id="rail-experience-title"
            className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Experience Finland by train.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
            Historical Finnish timetable data powers a focused booking flow with
            modern validation, accessible interactions and server-owned pricing.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src="/images/Group_637-2-2.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent"
          />
        </div>

        <div className="p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Under the hood
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Real data. Real edge cases.
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Exact GTFS seconds, including times after 24:00.</li>
            <li>
              Segment-aware seat inventory instead of a simple booked flag.
            </li>
            <li>
              Database-backed protection against concurrent double booking.
            </li>
          </ul>
        </div>
      </article>
    </div>
  </section>
);

export default RailExperience;

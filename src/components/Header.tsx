import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[60] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg text-xl font-extrabold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Juna<span className="text-blue-600">Lippu</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setAboutOpen((open) => !open)}
            aria-expanded={aboutOpen}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            About
          </button>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() =>
              session
                ? void signOut({ callbackUrl: "/" })
                : void signIn("google", { callbackUrl: "/" })
            }
            className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {session ? "Log out" : "Log in"}
          </button>
        </nav>
      </div>

      {aboutOpen && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-4 text-sm leading-6 text-slate-600 sm:px-6">
            JunaLippu is a portfolio railway-booking demo built with Next.js,
            tRPC, Prisma and NextAuth. It uses a historical sample timetable and
            does not process real payments.
          </div>
        </div>
      )}
      </header>
    </>
  );
};

export default Header;

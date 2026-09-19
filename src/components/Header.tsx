import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { useGoogleAuthStatus } from "~/hooks/useGoogleAuthStatus";

const Header = () => {
  const { data: session, status } = useSession();
  const googleAuthStatus = useGoogleAuthStatus();
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

          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-2 sm:gap-4"
          >
            {session && (
              <Link
                href="/bookings"
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                My bookings
              </Link>
            )}
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
              disabled={
                status === "loading" ||
                (!session && googleAuthStatus !== "available")
              }
              onClick={() => {
                if (session) {
                  void signOut({ callbackUrl: "/" });
                } else if (googleAuthStatus === "available") {
                  void signIn("google", { callbackUrl: "/" });
                }
              }}
              className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {session
                ? "Log out"
                : googleAuthStatus === "unavailable"
                  ? "Sign-in unavailable"
                  : googleAuthStatus === "loading"
                    ? "Checking sign-in…"
                    : "Log in"}
            </button>
          </nav>
        </div>

        {aboutOpen && (
          <div className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
              <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <Image
                  src="/images/logo.png"
                  alt=""
                  width={650}
                  height={520}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <div className="text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">
                  JunaLippu · portfolio railway-booking demo
                </p>
                <p>
                  Built with Next.js, tRPC, Prisma and NextAuth using historical
                  2024 timetable data. No real payments are processed.
                </p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

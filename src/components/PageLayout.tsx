import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import Footer from "~/components/Footer";
import Header from "~/components/Header";

const widths = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-6xl",
} as const;

type PageLayoutProps = {
  title: string;
  description?: string;
  width?: keyof typeof widths;
  children: React.ReactNode;
};

const PageLayout = ({
  title,
  description,
  width = "full",
  children,
}: PageLayoutProps) => {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const canonical = siteUrl
    ? new URL(router.asPath.split("?")[0] ?? "/", siteUrl).toString()
    : null;

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:site_name" content="JunaLippu" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        {description && (
          <meta name="twitter:description" content={description} />
        )}
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main
          id="main-content"
          className={`mx-auto ${widths[width]} px-4 py-8 sm:px-6 sm:py-12`}
        >
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PageLayout;

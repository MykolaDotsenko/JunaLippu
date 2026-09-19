import React from "react";
import Head from "next/head";

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

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  width = "full",
  children,
}) => (
  <>
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
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

export default PageLayout;

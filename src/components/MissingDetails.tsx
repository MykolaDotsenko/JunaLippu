import React from "react";
import Link from "next/link";

type MissingDetailsProps = {
  title: string;
  description?: string;
  linkLabel?: string;
};

const MissingDetails: React.FC<MissingDetailsProps> = ({
  title,
  description,
  linkLabel = "Back to search",
}) => (
  <div
    role="alert"
    className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
  >
    <h1 className="text-xl font-bold">{title}</h1>
    {description && <p className="mt-2 text-sm">{description}</p>}
    <Link
      href="/"
      className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 font-semibold text-white"
    >
      {linkLabel}
    </Link>
  </div>
);

export default MissingDetails;

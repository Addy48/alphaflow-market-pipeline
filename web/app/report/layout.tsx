import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutional Research Tear-Sheet | AlphaFlow Quantitative Platform",
  description:
    "Cryptographically verified quantitative research docket and factor tear-sheet across S&P 500 and NIFTY 50 equities.",
  alternates: {
    canonical: "/report",
  },
  openGraph: {
    title: "Institutional Research Tear-Sheet | AlphaFlow Quantitative Platform",
    description:
      "Cryptographically verified quantitative research docket and factor tear-sheet across S&P 500 and NIFTY 50 equities.",
    url: "https://alphaflow-terminal.vercel.app/report",
  },
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

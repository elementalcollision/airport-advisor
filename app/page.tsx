"use client";

import dynamic from "next/dynamic";

const AdvisorApp = dynamic(() => import("@/components/AdvisorApp"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-bg-primary" />,
});

export default function Home() {
  return <AdvisorApp />;
}

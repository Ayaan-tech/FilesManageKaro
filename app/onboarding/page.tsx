'use client';

import NavBar from "@/components/nav";
import FileExplorer from "@/components/file-explorer";
import dynamic from 'next/dynamic';

const Spline = dynamic(
  () => import("@splinetool/react-spline"),
  { ssr: false }
);

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Spline Background */}
      <div className="fixed inset-0 z-0">
        <Spline scene="https://prod.spline.design/75Xxwu3hq9vRuQ-T/scene.splinecode" />
      </div>

      {/* Overlay for better readability */}
      <div className="fixed inset-0 z-[1] bg-slate-900/60 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto pt-16">
            <FileExplorer />
          </div>
        </div>
      </div>
    </div>
  );
}

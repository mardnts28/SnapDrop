import React from "react";

// Inline SVG Icons for 0-dependency builds
const CameraIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ImageIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const RefreshIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M16 3h5v5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 21H3v-5" />
  </svg>
);

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between bg-slate-900 text-white overflow-x-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 flex w-full max-w-md items-center justify-between px-6 py-5 backdrop-blur-md bg-slate-900/40 border-b border-slate-800/60 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <CameraIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-200 via-white to-purple-200 bg-clip-text text-base font-bold tracking-tight text-transparent">
              SnapDrop Base
            </h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
              Direct to Drive
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          Service Ready
        </div>
      </header>

      {/* Main Content Area */}
      <main className="z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-8">
        {/* Camera Container Placeholder */}
        <div className="relative aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-xl">
          {/* Neon inner border element */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          {/* Simulated Camera Viewfinder Corners */}
          <div className="absolute top-6 left-6 h-5 w-5 border-t-2 border-l-2 border-slate-700/80" />
          <div className="absolute top-6 right-6 h-5 w-5 border-t-2 border-r-2 border-slate-700/80" />
          <div className="absolute bottom-6 left-6 h-5 w-5 border-b-2 border-l-2 border-slate-700/80" />
          <div className="absolute bottom-6 right-6 h-5 w-5 border-b-2 border-r-2 border-slate-700/80" />

          {/* Placeholder Center State */}
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-slate-800 shadow-inner">
              <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-md animate-pulse" />
              <CameraIcon className="relative h-9 w-9 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">
                Camera Feed Placeholder
              </h2>
              <p className="mt-1.5 px-4 text-xs leading-relaxed text-slate-400">
                The live camera feed and capture controls will be integrated here for instant uploads.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Controls Placeholder */}
      <footer className="z-10 flex w-full max-w-md flex-col items-center justify-center gap-4 px-6 pb-8 pt-4">
        {/* Control Button Mockups */}
        <div className="flex w-full items-center justify-center gap-6">
          <button
            type="button"
            disabled
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/60 text-slate-500 cursor-not-allowed transition-colors"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 cursor-not-allowed transition-all"
          >
            <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 blur-sm transition-opacity" />
            <div className="relative h-7 w-7 rounded-full border-2 border-white/90" />
          </button>

          <button
            type="button"
            disabled
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/60 text-slate-500 cursor-not-allowed transition-colors"
          >
            <RefreshIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          Service Account Storage
        </p>
      </footer>
    </div>
  );
}

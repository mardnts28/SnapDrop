"use client";

import React, { useState, useEffect, useRef } from "react";

// Inline SVG Icons for 0-dependency builds
const CameraIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const CheckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const LoaderIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${className}`}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);

  // Initialize camera stream
  const startCamera = async () => {
    try {
      setStatus('idle');
      setErrorMessage("");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setStatus('error');
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please grant permission in your browser/system settings."
          : "Could not access the rear camera. Please check your camera connection."
      );
    }
  };

  useEffect(() => {
    startCamera();

    // Clean up video stream on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (status === 'capturing') return;
    
    const video = videoRef.current;
    if (!video || !video.srcObject) {
      setStatus('error');
      setErrorMessage("No active video feed found.");
      return;
    }

    try {
      setStatus('capturing');
      // Trigger camera shutter flash effect
      setShowShutterFlash(true);
      setTimeout(() => setShowShutterFlash(false), 150);

      // Create a temporary canvas matching the video dimensions
      const canvas = document.createElement("canvas");
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not acquire 2D canvas context.");
      }

      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Convert to compressed base64 JPEG string (85% quality)
      const base64Image = canvas.toDataURL("image/jpeg", 0.85);
      
      // Store thumbnail for success state UI
      setCapturedThumbnail(base64Image);
      
      // Log for verification
      console.log("Captured Base64 Image:", base64Image);

      // Simulate network upload delay
      setTimeout(() => {
        setStatus('success');
        
        // Return to idle state after showing success checkmark
        setTimeout(() => {
          setStatus('idle');
          setCapturedThumbnail(null);
        }, 3000);
      }, 1500);

    } catch (err: any) {
      console.error("Error capturing photo:", err);
      setStatus('error');
      setErrorMessage(err.message || "Failed to capture photo.");
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white overflow-hidden select-none">
      {/* 1. Camera Video Element */}
      {status !== 'error' && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover z-0"
        />
      )}

      {/* Camera Viewfinder Corners / Overlay reticle */}
      {status === 'idle' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {/* Subtle reticle corners */}
          <div className="relative w-64 h-64 border border-white/20 rounded-3xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-xl" />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Shutter Shutter Flash Animation Overlay */}
      <div 
        className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${
          showShutterFlash ? "opacity-100" : "opacity-0"
        }`} 
      />

      {/* Header Overlay */}
      <header className="z-30 flex w-full items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 backdrop-blur-[2px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <CameraIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-200 via-white to-purple-200 bg-clip-text text-base font-bold tracking-tight text-transparent">
              SnapDrop
            </h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
              Direct to Drive
            </p>
          </div>
        </div>

        {/* Pulsating status badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          Active
        </div>
      </header>

      {/* Error State Card */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 z-30">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <AlertIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-200">Camera Access Error</h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={startCamera}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm font-semibold shadow-lg shadow-indigo-600/30"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success State Overlay Toast */}
      {status === 'success' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5 animate-slide-down">
            <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Upload Complete</p>
              <p className="text-[10px] text-emerald-500/80">Compressed & output to console</p>
            </div>
          </div>
        </div>
      )}

      {/* Capturing / Uploading Overlay Toast */}
      {status === 'capturing' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/15 backdrop-blur-md border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-500/5">
            <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              <LoaderIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Uploading Snap...</p>
              <p className="text-[10px] text-indigo-400/80">Simulating network delay</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full-Bleed UI Controls Overlay (Bottom) */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center gap-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-30">
        
        <div className="relative flex w-full items-center justify-center gap-8">
          {/* Thumbnail / Shutter History Frame */}
          <div className="absolute left-6 h-14 w-14 rounded-2xl border-2 border-white/20 bg-slate-950/40 overflow-hidden flex items-center justify-center shadow-lg backdrop-blur-sm">
            {capturedThumbnail ? (
              <img
                src={capturedThumbnail}
                alt="Captured Thumbnail"
                className="h-full w-full object-cover animate-fade-in"
              />
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-dashed border-white/20" />
            )}
          </div>

          {/* Shutter Button container */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== 'idle'}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/10 backdrop-blur-sm shadow-2xl active:scale-90 transition-all duration-150"
            aria-label="Capture photo"
          >
            <span className={`h-14 w-14 rounded-full bg-white transition-all duration-200 ${
              status === 'capturing' ? 'scale-75 bg-slate-400' : 'group-hover:scale-[1.03]'
            }`} />
            
            {status === 'capturing' && (
              <span className="absolute inset-0 flex items-center justify-center">
                <LoaderIcon className="h-8 w-8 text-indigo-600" />
              </span>
            )}
          </button>

          {/* Dummy alignment spacer */}
          <div className="w-14 h-14 opacity-0 pointer-events-none" />
        </div>

        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
          Service Account Storage
        </p>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";

// Minimalist, professional SVG Icons
const CameraIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
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

const CheckIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
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
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
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

const LoaderIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
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
          ? "Camera permission denied. Please grant permission in your browser settings."
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
    <div className="relative flex h-screen w-full flex-col bg-slate-900 overflow-hidden select-none font-sans">
      {/* Camera Video Element */}
      {status !== 'error' && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover z-0"
        />
      )}

      {/* Modern Dual-Tone Viewfinder Reticle */}
      {status === 'idle' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="relative w-60 h-60 border border-white/20 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/70 rounded-tl-lg shadow-sm" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/70 rounded-tr-lg shadow-sm" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/70 rounded-bl-lg shadow-sm" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/70 rounded-br-lg shadow-sm" />
            
            {/* Minimalist target point */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
          </div>
        </div>
      )}

      {/* Physical Camera Shutter Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${
          showShutterFlash ? "opacity-100" : "opacity-0"
        }`} 
      />

      {/* Floating Header Panel (Light & Glassmorphic) */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-30">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/50 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <CameraIcon className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xs font-semibold tracking-tight text-slate-800">
                SnapDrop
              </h1>
            </div>
          </div>

          {/* Minimalist Connection Indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-500"></span>
            </span>
            Ready
          </div>
        </div>
      </header>

      {/* Floating Alert/Toast Notifications */}
      {status === 'capturing' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xs animate-fade-in">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-100 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <LoaderIcon className="text-slate-500" />
            <span className="text-xs font-medium tracking-tight text-slate-700">Uploading to Drive...</span>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xs animate-fade-in">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-100 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckIcon className="h-3 w-3" />
            </div>
            <span className="text-xs font-medium tracking-tight text-slate-700">Saved successfully</span>
          </div>
        </div>
      )}

      {/* Full-Screen Light-Themed Error Display */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50 z-30">
          <div className="max-w-xs w-full p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
              <AlertIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Camera Access Required</h2>
              <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={startCamera}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-98 transition-all text-xs font-semibold text-white shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Floating Control Console (Light-Themed Glass) */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-30">
        <div className="p-3 rounded-[24px] bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex w-full items-center justify-between px-3">
            
            {/* Left: Minimalist Image Thumbnail */}
            <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden flex items-center justify-center shadow-inner">
              {capturedThumbnail ? (
                <img
                  src={capturedThumbnail}
                  alt="Captured Thumbnail"
                  className="h-full w-full object-cover transition-opacity duration-200"
                />
              ) : (
                <div className="h-3 w-3 rounded-full border border-slate-300" />
              )}
            </div>

            {/* Center: Leica/Mirrorless Camera Style Shutter Button */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={status !== 'idle'}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-900 bg-transparent active:scale-95 transition-all duration-150"
              aria-label="Capture photo"
            >
              <span className={`h-11 w-11 rounded-full bg-slate-900 transition-all duration-200 ${
                status === 'capturing' ? 'scale-75 bg-slate-400' : 'group-hover:scale-[1.01]'
              }`} />
              
              {status === 'capturing' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <LoaderIcon className="h-5 w-5 text-white" />
                </span>
              )}
            </button>

            {/* Right: Technical Mode Selector */}
            <div className="h-10 w-10 flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 select-none">FHD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

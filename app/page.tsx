"use client";

import React, { useState, useEffect, useRef } from "react";
import { uploadFileAction } from "@/app/actions/upload";

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
    strokeWidth="2.5"
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
  const [thumbnailType, setThumbnailType] = useState<'image' | 'video' | null>(null);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);

  // Video & recording specific states
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream
  const startCamera = async (currentMode: 'photo' | 'video' = mode) => {
    try {
      setStatus('idle');
      setErrorMessage("");
      
      // Clean up previous stream and release locks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: currentMode === 'video' // Require audio only in video mode
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setStatus('error');
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera or microphone permission denied. Please grant permission in settings."
          : "Could not access media devices. Please check your camera/mic connection."
      );
    }
  };

  useEffect(() => {
    startCamera(mode);

    // Clean up video stream on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode]);

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
      setThumbnailType('image');

      // Call direct Google Drive upload Server Action
      uploadFileAction(base64Image, "image/jpeg")
        .then((result) => {
          if (result.success) {
            setStatus('success');
            // Return to idle state after showing success checkmark
            setTimeout(() => {
              setStatus('idle');
              setCapturedThumbnail(null);
              setThumbnailType(null);
            }, 3000);
          } else {
            console.error("Upload action failed:", result.message);
            setStatus('error');
            setErrorMessage(result.message);
          }
        })
        .catch((err) => {
          console.error("Upload network/server error:", err);
          setStatus('error');
          setErrorMessage(err.message || "Failed to upload to Google Drive.");
        });

    } catch (err: any) {
      console.error("Error capturing photo:", err);
      setStatus('error');
      setErrorMessage(err.message || "Failed to capture photo.");
    }
  };

  const startRecording = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) {
      setStatus('error');
      setErrorMessage("No active video feed found.");
      return;
    }

    const stream = video.srcObject as MediaStream;
    recordedChunksRef.current = [];
    setRecordingTime(0);

    // Select suitable video MIME types depending on platform support
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/mp4' }; // Safari fallback
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: '' }; // Fallback to browser default
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        setStatus('capturing');
        
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'video/webm'
        });

        if (blob.size === 0) {
          setStatus('error');
          setErrorMessage("Recorded video is empty.");
          return;
        }

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
          const fileName = `snap_${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;

          uploadFileAction(base64Data, blob.type, fileName)
            .then((result) => {
              if (result.success) {
                setStatus('success');
                // Store video preview URL for thumbnail
                setCapturedThumbnail(URL.createObjectURL(blob));
                setThumbnailType('video');
                
                setTimeout(() => {
                  setStatus('idle');
                  setCapturedThumbnail(null);
                  setThumbnailType(null);
                }, 3000);
              } else {
                console.error("Upload action failed:", result.message);
                setStatus('error');
                setErrorMessage(result.message);
              }
            })
            .catch((err) => {
              console.error("Upload error:", err);
              setStatus('error');
              setErrorMessage(err.message || "Failed to upload video to Drive.");
            });
        };
      };

      recorder.start(1000);
      setIsRecording(true);

      // Start countdown timer (cap at 30 seconds)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (e: any) {
      console.error("Failed to start MediaRecorder:", e);
      setStatus('error');
      setErrorMessage("Could not start video recording. Make sure mic permission is granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const triggerAction = () => {
    if (mode === 'photo') {
      handleCapture();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
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
          className="absolute inset-0 h-full w-full object-cover z-0 bg-black"
        />
      )}

      {/* Modern Viewfinder Reticle using Light Blue (#4BB8FA) & Accent Blue (#1591DC) */}
      {status === 'idle' && !isRecording && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="relative w-60 h-60 border border-white/20 rounded-2xl">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#4BB8FA] rounded-tl-lg shadow-sm" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#4BB8FA] rounded-tr-lg shadow-sm" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#4BB8FA] rounded-bl-lg shadow-sm" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#4BB8FA] rounded-br-lg shadow-sm" />
            
            {/* Minimalist target point using Accent Blue */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#1591DC] rounded-full border-2 border-white shadow-md shadow-[#2C5EAD]/30" />
          </div>
        </div>
      )}

      {/* Physical Camera Shutter Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${
          showShutterFlash ? "opacity-100" : "opacity-0"
        }`} 
      />

      {/* Floating Header Panel (Utilizing Pale Ice Blue #C4E2F5 & Deep Blue #2C5EAD) */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-30">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#C4E2F5]/60 shadow-[0_2px_12px_rgba(44,94,173,0.06)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] text-white shadow-sm shadow-[#2C5EAD]/20">
              <CameraIcon className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-[#2C5EAD]">
                SnapDrop
              </h1>
            </div>
          </div>

          {/* Connection Indicator using Accent Blue (#1591DC) & Ice Blue (#C4E2F5) */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#C4E2F5]/40 px-2.5 py-0.5 text-[10px] font-semibold text-[#2C5EAD] border border-[#4BB8FA]/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-[#1591DC] opacity-75 ${isRecording ? "animate-ping" : "animate-pulse"}`}></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1591DC]"></span>
            </span>
            {isRecording ? "Recording" : "Active"}
          </div>
        </div>
      </header>

      {/* Recording Timer Overlay (Dynamic countdown) */}
      {isRecording && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-red-500/30 text-white font-mono text-xs select-none">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          00:{recordingTime.toString().padStart(2, '0')} / 00:30
        </div>
      )}

      {/* Centered Loading Indicator (No Box Container) */}
      {status === 'capturing' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="h-8 w-8 text-[#1591DC] drop-shadow-[0_1px_3px_rgba(255,255,255,0.6)]" />
            <span className="text-sm font-semibold tracking-tight text-[#2C5EAD] drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)] select-none">
              Saving to drive...
            </span>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xs animate-fade-in">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-[#C4E2F5] text-slate-800 shadow-[0_4px_16px_rgba(44,94,173,0.08)]">
            <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] flex items-center justify-center text-white">
              <CheckIcon className="h-3 w-3" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-[#2C5EAD]">Saved successfully</span>
          </div>
        </div>
      )}

      {/* Full-Screen Light-Themed Error Display */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50 z-30">
          <div className="max-w-xs w-full p-5 rounded-2xl bg-white border border-[#C4E2F5] shadow-lg flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#C4E2F5]/40 flex items-center justify-center text-[#2C5EAD] border border-[#4BB8FA]/30">
              <AlertIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2C5EAD]">Access Required</h2>
              <p className="mt-1 text-[11px] text-[#2C5EAD]/80 leading-normal">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => startCamera(mode)}
              className="w-full py-2 px-3 rounded-lg bg-[#2C5EAD] hover:bg-[#1591DC] active:scale-98 transition-all text-xs font-semibold text-white shadow-md shadow-[#2C5EAD]/20"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Floating Control Console (Light-Themed Glass with Custom Palette) */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-30">
        <div className="p-3.5 rounded-[24px] bg-white/80 backdrop-blur-md border border-[#C4E2F5]/50 shadow-[0_4px_24px_rgba(44,94,173,0.08)]">
          
          {/* iOS-style Mode Switcher */}
          <div className="flex justify-center gap-6 mb-3 select-none">
            <button
              type="button"
              disabled={isRecording || status === 'capturing'}
              onClick={() => setMode('photo')}
              className={`text-[10px] font-extrabold tracking-widest transition-all duration-200 ${
                mode === 'photo' 
                  ? 'text-[#2C5EAD] scale-110' 
                  : 'text-[#2C5EAD]/40 hover:text-[#2C5EAD]/60'
              }`}
            >
              PHOTO
            </button>
            <button
              type="button"
              disabled={isRecording || status === 'capturing'}
              onClick={() => setMode('video')}
              className={`text-[10px] font-extrabold tracking-widest transition-all duration-200 ${
                mode === 'video' 
                  ? 'text-red-500 scale-110' 
                  : 'text-[#2C5EAD]/40 hover:text-[#2C5EAD]/60'
              }`}
            >
              VIDEO
            </button>
          </div>

          <div className="flex w-full items-center justify-between px-3">
            
            {/* Left: Minimalist Image/Video Thumbnail Frame */}
            <div className="h-10 w-10 rounded-lg border border-[#C4E2F5] bg-[#C4E2F5]/10 overflow-hidden flex items-center justify-center shadow-inner">
              {capturedThumbnail ? (
                thumbnailType === 'video' ? (
                  <video
                    src={capturedThumbnail}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={capturedThumbnail}
                    alt="Captured Thumbnail"
                    className="h-full w-full object-cover transition-opacity duration-200"
                  />
                )
              ) : (
                <div className="h-3 w-3 rounded-full border border-[#4BB8FA]/40" />
              )}
            </div>

            {/* Center: Mirrorless Camera Style Shutter / Record Button */}
            <button
              type="button"
              onClick={triggerAction}
              disabled={status === 'capturing' || (status !== 'idle' && !isRecording)}
              className={`group relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-150 active:scale-95 ${
                mode === 'video' ? 'border-red-500' : 'border-[#2C5EAD]'
              }`}
              aria-label={mode === 'photo' ? "Capture photo" : (isRecording ? "Stop recording" : "Start recording")}
            >
              {mode === 'photo' ? (
                <span className={`h-11 w-11 rounded-full bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] transition-all duration-200 ${
                  status === 'capturing' ? 'scale-75 opacity-40' : 'group-hover:scale-[1.01]'
                }`} />
              ) : (
                <span className={`transition-all duration-200 bg-red-500 ${
                  isRecording 
                    ? 'h-5 w-5 rounded animate-pulse' // Square stop icon
                    : 'h-11 w-11 rounded-full group-hover:scale-[1.01]'
                }`} />
              )}
              
              {status === 'capturing' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <LoaderIcon className="h-5 w-5 text-white" />
                </span>
              )}
            </button>

            {/* Right: Technical Mode Selector */}
            <div className="h-10 w-10 flex items-center justify-center select-none">
              <span className="text-[10px] font-bold tracking-wider text-[#2C5EAD]/60">
                {mode === 'photo' ? 'FHD' : 'HD'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

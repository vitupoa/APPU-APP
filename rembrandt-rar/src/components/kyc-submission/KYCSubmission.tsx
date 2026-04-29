"use client";

import { useState, useRef } from "react";
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface KYCSubmissionProps {
  onSubmit: (data: {
    documentType: string;
    frontImageUrl: string;
    backImageUrl: string | null;
    selfieUrl: string;
  }) => Promise<void>;
  onCancel: () => void;
}

type CaptureStep = "document-type" | "front" | "back" | "selfie" | "review";

export function KYCSubmission({ onSubmit, onCancel }: KYCSubmissionProps) {
  const [step, setStep] = useState<CaptureStep>("document-type");
  const [documentType, setDocumentType] = useState<string>("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: step === "selfie" ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setIsCapturing(true);
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      if (step === "front") {
        setFrontImage(imageData);
        stopCamera();
        setStep(documentType === "PASSPORT" ? "selfie" : "back");
      } else if (step === "back") {
        setBackImage(imageData);
        stopCamera();
        setStep("selfie");
      } else if (step === "selfie") {
        setSelfieImage(imageData);
        stopCamera();
        setStep("review");
      }
    }
  };

  const retakePhoto = (photoStep: CaptureStep) => {
    if (photoStep === "front") setFrontImage(null);
    if (photoStep === "back") setBackImage(null);
    if (photoStep === "selfie") setSelfieImage(null);
    setStep(photoStep);
  };

  const handleSubmit = async () => {
    if (!frontImage || !selfieImage) {
      setError("Please capture all required photos");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        documentType,
        frontImageUrl: frontImage,
        backImageUrl: backImage,
        selfieUrl: selfieImage
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">KYC Verification</h2>
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {step === "document-type" && (
          <div className="w-full max-w-md space-y-4">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold text-center">Select Document Type</h3>
              <p className="text-sm text-gray-600 text-center">
                Choose the ID document you'll be photographing
              </p>
              
              <div className="space-y-3">
                {[
                  { value: "NATIONAL_ID", label: "National Identity Card" },
                  { value: "DRIVING_LICENSE", label: "Driving License" },
                  { value: "PASSPORT", label: "Passport" }
                ].map((doc) => (
                  <button
                    key={doc.value}
                    onClick={() => {
                      setDocumentType(doc.value);
                      setStep("front");
                    }}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium">{doc.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(step === "front" || step === "back" || step === "selfie") && !isCapturing && (
          <div className="w-full max-w-md space-y-4">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold text-center">
                {step === "front" && "Capture Front of ID"}
                {step === "back" && "Capture Back of ID"}
                {step === "selfie" && "Take a Selfie"}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                {step === "front" && "Position your ID document within the frame and ensure all details are clearly visible"}
                {step === "back" && "Flip your ID and capture the back side"}
                {step === "selfie" && "Take a clear photo of your face. Make sure your face is well-lit and clearly visible"}
              </p>
              
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </button>
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed rounded-lg w-4/5 h-3/5 opacity-50"></div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="w-full max-w-2xl space-y-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold text-center">Review Your Photos</h3>
              
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Front Image */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Front of ID</h4>
                    <button
                      onClick={() => retakePhoto("front")}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Retake
                    </button>
                  </div>
                  {frontImage && (
                    <img src={frontImage} alt="Front" className="w-full rounded-lg border" />
                  )}
                </div>

                {/* Back Image */}
                {backImage && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Back of ID</h4>
                      <button
                        onClick={() => retakePhoto("back")}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Retake
                      </button>
                    </div>
                    <img src={backImage} alt="Back" className="w-full rounded-lg border" />
                  </div>
                )}

                {/* Selfie */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Selfie</h4>
                    <button
                      onClick={() => retakePhoto("selfie")}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Retake
                    </button>
                  </div>
                  {selfieImage && (
                    <img src={selfieImage} alt="Selfie" className="w-full rounded-lg border" />
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("document-type")}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Start Over
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit KYC
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Aperture, RotateCcw, Check, Loader2, ImageIcon } from 'lucide-react';
import { useCamera } from './useCamera';
import { uploadPrescription } from './uploadService';

const STAGES = [
    { key: 'uploading', label: '☁️ Uploading to cloud...', color: 'text-blue-500' },
    { key: 'ocr', label: '🔍 Extracting text via OCR...', color: 'text-purple-500' },
    { key: 'ai', label: '🤖 AI formatting data...', color: 'text-green-500' },
];

const PrescriptionUpload = ({ isOpen, onClose, onResult }) => {
    const { videoRef, isActive, error: cameraError, start, stop, capture } = useCamera();
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [stage, setStage] = useState(-1); // -1 = idle, 0-2 = stage index
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Auto-start camera when modal opens
    useEffect(() => {
        if (isOpen && !isActive && !capturedImage) {
            start();
        }
    }, [isOpen]);

    const handleCapture = async () => {
        const blob = await capture();
        if (blob) {
            setCapturedImage(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            stop();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCapturedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        stop();
    };

    const handleRetake = () => {
        setCapturedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setError(null);
        setStage(-1);
        start();
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        setError(null);

        // Simulated staged feedback
        setStage(0);
        const stageTimer1 = setTimeout(() => setStage(1), 3000);
        const stageTimer2 = setTimeout(() => setStage(2), 8000);

        try {
            const result = await uploadPrescription(capturedImage);
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            setStage(-1);
            setIsProcessing(false);

            // Pass result + preview to parent (chat integration)
            // Don't revoke previewUrl here — the chat message needs it
            const savedPreview = previewUrl;
            if (onResult) onResult(result, savedPreview);
            // Close without revoking the preview (it's now owned by the chat)
            stop();
            setCapturedImage(null);
            setPreviewUrl(null);
            setError(null);
            setStage(-1);
            setIsProcessing(false);
            onClose();
        } catch (err) {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            setStage(-1);
            setIsProcessing(false);
            setError(err.message || 'Upload failed');
        }
    };

    const handleClose = () => {
        stop();
        setCapturedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setError(null);
        setStage(-1);
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl"
                onClick={(e) => e.target === e.currentTarget && !isProcessing && handleClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/5"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text">Scan Prescription</h2>
                                <p className="text-xs text-text-muted">Position the prescription in frame</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4 text-text-muted" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Camera / Preview Area */}
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 mb-4">
                            {isActive && !capturedImage && (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Scan overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
                                        <div className="absolute inset-4 overflow-hidden rounded-xl">
                                            <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-[scan_2s_ease-in-out_infinite]" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {previewUrl && (
                                <img src={previewUrl} alt="Captured" className="w-full h-full object-contain bg-white dark:bg-black/40" />
                            )}

                            {!isActive && !capturedImage && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                                    <ImageIcon className="w-12 h-12 opacity-30" />
                                    <p className="text-sm">Choose how to upload your prescription</p>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {(error || cameraError) && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                {error || cameraError}
                            </div>
                        )}

                        {/* Staged Progress */}
                        {isProcessing && (
                            <div className="mb-4 space-y-2">
                                {STAGES.map((s, i) => (
                                    <motion.div
                                        key={s.key}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: i <= stage ? 1 : 0.3, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${i <= stage
                                            ? 'bg-primary/5 border border-primary/10'
                                            : 'bg-black/[0.02] dark:bg-white/[0.02] border border-transparent'
                                            }`}
                                    >
                                        {i < stage ? (
                                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        ) : i === stage ? (
                                            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0" />
                                        )}
                                        <span className={i <= stage ? s.color : 'text-text-muted/50'}>
                                            {s.label}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {!capturedImage && !isActive && (
                                <button
                                    onClick={start}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
                                >
                                    <Camera className="w-4 h-4" />
                                    Open Camera
                                </button>
                            )}

                            {isActive && !capturedImage && (
                                <button
                                    onClick={handleCapture}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
                                >
                                    <Aperture className="w-5 h-5" />
                                    Capture
                                </button>
                            )}

                            {capturedImage && !isProcessing && (
                                <>
                                    <button
                                        onClick={handleRetake}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-text font-semibold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Retake
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-all shadow-sm"
                                    >
                                        <Check className="w-4 h-4" />
                                        Extract Data
                                    </button>
                                </>
                            )}

                            {isProcessing && (
                                <button
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary/80 text-white font-semibold text-sm opacity-80 cursor-not-allowed"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <style>{`
        @keyframes scan {
          0%, 100% { top: 1rem; }
          50% { top: calc(100% - 1rem); }
        }
      `}</style>
        </AnimatePresence>,
        document.body
    );
};

export default PrescriptionUpload;

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Aperture, RotateCcw, Check, Loader2, ImageIcon, FileText } from 'lucide-react';
import { useCamera } from './useCamera';
import { uploadPrescription } from './uploadService';

const STAGES = [
    { key: 'uploading', label: '☁️ Uploading to cloud...', color: 'text-blue-500' },
    { key: 'ocr', label: '🔍 Extracting text via OCR...', color: 'text-purple-500' },
    { key: 'ai', label: '🤖 AI formatting data...', color: 'text-green-500' },
];

// Mode: 'pick' | 'camera' | 'preview'
const PrescriptionUpload = ({ isOpen, onClose, onResult }) => {
    const { videoRef, isActive, error: cameraError, start, stop, capture } = useCamera();
    const [mode, setMode] = useState('pick'); // 'pick' | 'camera' | 'preview'
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [stage, setStage] = useState(-1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Reset to pick mode when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setMode('pick');
            setCapturedImage(null);
            setPreviewUrl(null);
            setError(null);
            setStage(-1);
            setIsProcessing(false);
        } else {
            stop();
        }
    }, [isOpen]);

    const handleOpenCamera = async () => {
        setMode('camera');
        await start();
    };

    const handleCapture = async () => {
        const blob = await capture();
        if (blob) {
            setCapturedImage(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            stop();
            setMode('preview');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCapturedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        stop();
        setMode('preview');
    };

    const handleRetake = () => {
        setCapturedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setError(null);
        setStage(-1);
        setMode('pick');
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        setError(null);

        setStage(0);
        const stageTimer1 = setTimeout(() => setStage(1), 3000);
        const stageTimer2 = setTimeout(() => setStage(2), 8000);

        try {
            const result = await uploadPrescription(capturedImage);
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            setStage(-1);
            setIsProcessing(false);

            const savedPreview = previewUrl;
            if (onResult) onResult(result, savedPreview);
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
        setMode('pick');
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl"
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
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text">Upload Prescription</h2>
                                <p className="text-xs text-text-muted">
                                    {mode === 'pick' && 'Choose how to submit your prescription'}
                                    {mode === 'camera' && 'Position the prescription clearly in frame'}
                                    {mode === 'preview' && 'Review your prescription image'}
                                </p>
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

                        {/* ─── MODE: PICK ─── */}
                        {mode === 'pick' && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-4"
                                >
                                    <p className="text-sm text-text-muted text-center mb-2">
                                        Select one of the options below to submit your prescription for verification.
                                    </p>

                                    {/* Option 1: Take a Photo */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleOpenCamera}
                                        className="flex items-center gap-4 w-full p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                                            <Camera className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base font-semibold text-text">Take a Photo</p>
                                            <p className="text-sm text-text-muted mt-0.5">Use your device camera to capture the prescription right now</p>
                                        </div>
                                    </motion.button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-1">
                                        <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
                                        <span className="text-xs text-text-muted font-medium">OR</span>
                                        <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
                                    </div>

                                    {/* Option 2: Upload File */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-4 w-full p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                                            <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base font-semibold text-text">Upload from Device</p>
                                            <p className="text-sm text-text-muted mt-0.5">Choose an existing photo, image, or PDF from your files</p>
                                        </div>
                                    </motion.button>

                                    {/* Hidden file input — accepts images AND PDFs */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}

                        {/* ─── MODE: CAMERA ─── */}
                        {mode === 'camera' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black mb-4">
                                    {isActive && (
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
                                    {!isActive && (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/50">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-sm">Starting camera...</p>
                                        </div>
                                    )}
                                </div>

                                {cameraError && (
                                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                        {cameraError} — <button className="underline" onClick={handleRetake}>Go back</button>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRetake}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-text font-semibold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCapture}
                                        disabled={!isActive}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Aperture className="w-5 h-5" />
                                        Capture
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── MODE: PREVIEW ─── */}
                        {mode === 'preview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {/* Preview image */}
                                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 mb-4">
                                    {previewUrl && (
                                        <img src={previewUrl} alt="Prescription preview" className="w-full h-full object-contain bg-white dark:bg-black/40" />
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                        {error}
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
                                    {!isProcessing && (
                                        <>
                                            <button
                                                onClick={handleRetake}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-text font-semibold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Try Again
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-all shadow-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                                Submit
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
                            </motion.div>
                        )}
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

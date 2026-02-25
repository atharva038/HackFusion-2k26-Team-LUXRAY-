import React, { useState, useRef, useCallback } from 'react';
import { Mic, Send, Square, Loader2, Camera, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { sendChatMessage, fetchTTSAudio } from '../../services/api';
import PrescriptionUpload from '../../features/prescription/PrescriptionUpload';
import { uploadPrescription } from '../../features/prescription/uploadService';

// Get browser SpeechRecognition constructor
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const InputArea = () => {
    const [text, setText] = useState('');
    const {
        addMessage, aiStatus, setAiStatus, setTyping,
        setLiveTranscript, setActiveSubtitle
    } = useAppStore();
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const manualStopRef = useRef(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const fileUploadRef = useRef(null);

    const isListening = aiStatus === AI_STATUS.LISTENING;
    const isProcessing = aiStatus === AI_STATUS.PROCESSING;
    const isSpeaking = aiStatus === AI_STATUS.SPEAKING;
    const isBusy = isProcessing || isSpeaking;

    // ─── Start Listening Helper ─────────────────────────────────
    const startListening = useCallback(() => {
        if (!SpeechRecognition) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setActiveSubtitle('');
        }

        manualStopRef.current = false;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setAiStatus(AI_STATUS.LISTENING);
            setLiveTranscript('');
            setText('');
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            const currentText = final || interim;
            setLiveTranscript(currentText);
            setText(currentText);
        };

        recognition.onend = () => {
            const currentText = useAppStore.getState().liveTranscript;
            setLiveTranscript('');

            // If user manually stopped the mic, just go back to ready — don't send
            if (manualStopRef.current) {
                manualStopRef.current = false;
                setAiStatus(AI_STATUS.READY);
                return;
            }

            setAiStatus(AI_STATUS.READY);

            // Only send if there's actual text
            if (currentText && currentText.trim()) {
                processSend(currentText.trim());
            }
            // If no text was captured (silence), just go idle — don't send "didn't catch"
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setLiveTranscript('');
            setAiStatus(AI_STATUS.READY);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    // ─── OpenAI TTS Playback ────────────────────────────────────
    const speakText = useCallback(async (textToSpeak) => {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            setActiveSubtitle(textToSpeak);
            setAiStatus(AI_STATUS.SPEAKING);

            const blob = await fetchTTSAudio(textToSpeak);
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setActiveSubtitle('');
                setAiStatus(AI_STATUS.READY);
                URL.revokeObjectURL(url);
                audioRef.current = null;

                // Auto-open mic after AI finishes speaking
                setTimeout(() => startListening(), 500);
            };

            audio.onerror = () => {
                setActiveSubtitle('');
                setAiStatus(AI_STATUS.READY);
                URL.revokeObjectURL(url);
                audioRef.current = null;
            };

            audio.play().catch(console.error);
        } catch (err) {
            console.error('TTS playback error:', err);
            setActiveSubtitle('');
            setAiStatus(AI_STATUS.READY);
        }
    }, [setActiveSubtitle, setAiStatus, startListening]);

    // ─── Send Message Logic ─────────────────────────────────────
    const processSend = async (userText) => {
        if (!userText.trim()) return;

        addMessage({ id: Date.now(), role: 'user', text: userText });
        setAiStatus(AI_STATUS.PROCESSING);
        setTyping(true);

        try {
            const result = await sendChatMessage(userText);
            setTyping(false);

            const aiText = result.text || result.response || result.finalOutput || result.message || 'I processed your request.';

            const tools = (result.toolCalls || result.steps || []).map(step => ({
                icon: 'success',
                text: step.name || step.toolName || step,
                status: 'success'
            }));

            const aiMessage = { id: Date.now(), role: 'ai', text: aiText, tools };

            if (result.order || result.orderCard) {
                const o = result.order || result.orderCard;
                aiMessage.orderCard = {
                    orderId: o.orderId || o._id || 'N/A',
                    medicine: o.medicine || o.items?.map(i => i.name || i.medicine).join(', ') || 'N/A',
                    status: o.status || 'Confirmed',
                    eta: o.eta || 'Processing'
                };
            }

            addMessage(aiMessage);
            // Fire TTS in parallel — don't await, so text shows instantly
            speakText(aiText);
        } catch (err) {
            setTyping(false);
            setAiStatus(AI_STATUS.READY);
            addMessage({ id: Date.now(), role: 'ai', text: 'Sorry, I encountered an error. Please try again.', tools: [] });
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (isBusy) return;

        if (isListening) {
            stopListening();
            return;
        }

        const userText = text.trim();
        setText('');
        if (userText) {
            await processSend(userText);
        }
    };

    const stopListening = () => {
        manualStopRef.current = true;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const toggleVoice = () => {
        if (isBusy) return;
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const getPlaceholder = () => {
        if (isListening) return "Listening to you…";
        if (isProcessing) return "Processing your request…";
        if (isSpeaking) return "AI is responding…";
        return "Type your message or tap the mic…";
    };

    // ─── Prescription Upload Result Handler ──────────────────────
    const handlePrescriptionResult = (result, previewUrl = null) => {
        const imageUrl = previewUrl || result.imageUrl;

        // Non-prescription detection
        if (result.isPrescription === false) {
            addMessage({
                id: Date.now() + 1,
                role: 'ai',
                text: `⚠️ ${result.message || 'This image does not appear to be a medical prescription. Please upload a valid prescription image.'}`,
                tools: [
                    { icon: 'success', text: 'Cloudinary Upload', status: 'success' },
                    { icon: 'success', text: 'Mistral OCR', status: 'success' },
                    { icon: 'search', text: 'Not a prescription', status: 'warning' },
                ],
            });
            return;
        }

        const meds = result.medications || [];
        const medNames = meds.map(m => m.name || m.dosage).filter(Boolean);
        const summary = medNames.length > 0
            ? `📄 Prescription extracted! Found ${medNames.length} medicine${medNames.length > 1 ? 's' : ''}: ${medNames.join(', ')}.`
            : '📄 Prescription uploaded and saved to your profile.';

        addMessage({
            id: Date.now() + 1,
            role: 'ai',
            text: summary,
            tools: [
                { icon: 'success', text: 'Cloudinary Upload', status: 'success' },
                { icon: 'success', text: 'Mistral OCR', status: 'success' },
                { icon: 'success', text: 'AI Data Extraction', status: 'success' },
            ],
            prescriptionData: {
                medications: meds,
                imageUrl: result.imageUrl,
                recordId: result.recordId,
            },
        });
    };

    // ─── Direct File Upload Handler ──────────────────────────────
    const handleDirectFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = ''; // reset

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        addMessage({
            id: Date.now(),
            role: 'user',
            text: '📎 Uploaded a prescription image',
            imagePreview: previewUrl,
        });
        setAiStatus(AI_STATUS.PROCESSING);
        setTyping(true);

        try {
            const result = await uploadPrescription(file);
            setTyping(false);
            setAiStatus(AI_STATUS.READY);
            handlePrescriptionResult(result, previewUrl);
        } catch (err) {
            setTyping(false);
            setAiStatus(AI_STATUS.READY);
            addMessage({ id: Date.now(), role: 'ai', text: `❌ Upload failed: ${err.message}`, tools: [] });
        }
    };

    return (
        <div className="relative w-full pb-4">
            <AnimatePresence>
                {isListening && text && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="mb-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-sm text-text animate-fade-in-up"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="italic text-text-muted">{text}</span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {isListening && (
                <div className="absolute inset-x-4 -bottom-2 h-16 bg-primary/15 blur-2xl rounded-full z-0 transition-all duration-700" />
            )}

            <form
                id="chat-form"
                onSubmit={handleSend}
                className={`relative z-10 flex items-center gap-3 w-full bg-card border rounded-[2rem] p-2 pr-3 transition-all duration-500 ${isListening
                    ? 'ring-2 ring-primary/60 border-primary/20 bg-bg shadow-[0_0_30px_rgba(37,99,235,0.12)]'
                    : isBusy
                        ? 'border-black/5 dark:border-white/5 opacity-80'
                        : 'border-black/5 dark:border-white/5 shadow-soft focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10'
                    }`}
            >
                {/* Camera Button — opens camera modal */}
                <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(true)}
                    disabled={isBusy || isListening}
                    title="Scan Prescription"
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                        ${isBusy || isListening
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary'
                        }`}
                >
                    <Camera className="w-[18px] h-[18px]" />
                </button>

                {/* File Upload Button — direct file picker */}
                <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    disabled={isBusy || isListening}
                    title="Upload Prescription Image"
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                        ${isBusy || isListening
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary'
                        }`}
                >
                    <Paperclip className="w-[18px] h-[18px]" />
                </button>
                <input
                    ref={fileUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDirectFileUpload}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isBusy}
                    className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 relative ${isListening
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                        : isBusy
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text'
                        }`}
                >
                    {isListening ? (
                        <>
                            <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-30" />
                            <Square className="w-4 h-4 fill-current" />
                        </>
                    ) : isBusy ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={getPlaceholder()}
                    disabled={isListening || isBusy}
                    className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-[15px] px-2 text-text placeholder:text-text-muted/50 disabled:opacity-60 transition-opacity duration-300"
                />

                <button
                    type="submit"
                    disabled={(!text.trim() && !isListening) || isBusy}
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${(text.trim() || isListening) && !isBusy
                        ? 'bg-primary text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-transparent text-text-muted opacity-40 cursor-default'
                        }`}
                >
                    {isListening ? (
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    ) : (
                        <Send className="w-4 h-4 translate-x-px" />
                    )}
                </button>
            </form>

            <div className="text-center mt-3">
                <p className="text-[11px] text-text-muted font-medium opacity-50">AI can make mistakes. Please verify medical information.</p>
            </div>

            {/* Prescription Upload Modal */}
            <PrescriptionUpload
                isOpen={showPrescriptionModal}
                onClose={() => setShowPrescriptionModal(false)}
                onResult={(result, capturedPreviewUrl) => {
                    addMessage({
                        id: Date.now(),
                        role: 'user',
                        text: '📷 Captured a prescription image',
                        imagePreview: capturedPreviewUrl || result.imageUrl,
                    });
                    handlePrescriptionResult(result, capturedPreviewUrl);
                }}
            />
        </div>
    );
};

export default InputArea;

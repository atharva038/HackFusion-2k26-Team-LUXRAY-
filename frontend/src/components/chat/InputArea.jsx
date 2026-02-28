import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Send, Square, Loader2, Camera, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS, STT_CODES } from '../../store/useAppStore';
import { sendChatMessage, fetchTTSAudio, splitIntoSentences, fetchTTSChunked } from '../../services/api';
import PrescriptionUpload from '../../features/prescription/PrescriptionUpload';
import { uploadPrescription } from '../../features/prescription/uploadService';
import { parseStructuredOutput } from '../../utils/parseStructuredOutput';

// Get browser SpeechRecognition constructor
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const InputArea = () => {
    const [text, setText] = useState('');
    const {
        addMessage, aiStatus, setAiStatus, setTyping,
        setLiveTranscript, setActiveSubtitle,
        setCurrentAudioElement, currentSessionId, setCurrentSessionId,
        selectedLanguage
    } = useAppStore();
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const manualStopRef = useRef(false);
    const cancelSpeechRef = useRef(false);
    const inputRef = useRef(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const fileUploadRef = useRef(null);

    // ─── Image Attachment State ─────────────────────────────────
    const [attachedFile, setAttachedFile] = useState(null);
    const [attachedPreview, setAttachedPreview] = useState(null);
    const [queuedExistingRx, setQueuedExistingRx] = useState(null);

    const isListening = aiStatus === AI_STATUS.LISTENING;
    const isProcessing = aiStatus === AI_STATUS.PROCESSING;
    const isSpeaking = aiStatus === AI_STATUS.SPEAKING;
    const isBusy = isProcessing; // Unblock inputs during isSpeaking

    // ─── Reorder / Prescription Chat Bridge ─────────────────────
    // Keeps a live ref to processSend so the mount effect below never stales
    const processSendRef = useRef(null);

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
        // Read language at call-time from store (not from stale closure)
        const currentLang = useAppStore.getState().selectedLanguage;
        recognition.lang = STT_CODES[currentLang] || 'en-US';
        console.log(`[STT] Starting recognition with lang: ${recognition.lang}`);

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
                if (processSendRef.current) {
                    processSendRef.current(currentText.trim(), true); // Pass true because this came from voice
                }
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

    // ─── Sentence-Chunked TTS Playback (Low Latency) ────────────
    const playAudioBlob = useCallback((blob) => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            // Expose to the avatar so it can drive lip-sync via Web Audio API
            setCurrentAudioElement(audio);

            audio.onended = () => {
                URL.revokeObjectURL(url);
                audioRef.current = null;
                setCurrentAudioElement(null);
                resolve();
            };

            audio.onerror = (e) => {
                URL.revokeObjectURL(url);
                audioRef.current = null;
                setCurrentAudioElement(null);
                reject(e);
            };

            audio.play().catch(reject);
        });
    }, [setCurrentAudioElement]);

    const speakText = useCallback(async (textToSpeak) => {
        try {
            // Stop any current playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            cancelSpeechRef.current = false;
            setAiStatus(AI_STATUS.SPEAKING);

            // Read language at call-time to prevent stale closures
            const currentLang = useAppStore.getState().selectedLanguage;

            // Split into sentences for faster time-to-first-audio
            const sentences = splitIntoSentences(textToSpeak);

            // Fire ALL TTS requests in parallel immediately
            const blobPromises = fetchTTSChunked(sentences, currentLang);

            // Play back-to-back as each resolves (in order)
            for (let i = 0; i < sentences.length; i++) {
                if (cancelSpeechRef.current) break;

                try {
                    const blob = await blobPromises[i];
                    if (cancelSpeechRef.current) break;
                    // Show subtitle exactly when audio begins — not before
                    setActiveSubtitle(sentences[i]);
                    await playAudioBlob(blob);
                } catch (chunkErr) {
                    console.warn(`[TTS] Sentence ${i + 1} failed, skipping:`, chunkErr.message);
                    // Skip failed sentence, continue to next
                }
            }

            // All done
            setActiveSubtitle('');
            setAiStatus(AI_STATUS.READY);

            // Auto-open mic after AI finishes speaking
            if (!cancelSpeechRef.current) {
                setTimeout(() => startListening(), 500);
            }
        } catch (err) {
            console.error('TTS playback error:', err);
            setActiveSubtitle('');
            setAiStatus(AI_STATUS.READY);
        }
    }, [setActiveSubtitle, setAiStatus, startListening, playAudioBlob]);

    // ─── Send Message Logic ─────────────────────────────────────
    const processSend = async (userText, isVoiceInput = false, imageUrl = null, skipLocalDisplay = false) => {
        if (!userText.trim()) return;

        if (!skipLocalDisplay) {
            addMessage({ id: Date.now(), role: 'user', text: userText, imagePreview: imageUrl });
        }
        setAiStatus(AI_STATUS.PROCESSING);
        setTyping(true);

        try {
            const result = await sendChatMessage(userText, currentSessionId, selectedLanguage, imageUrl);
            setTyping(false);

            if (result.sessionId && result.sessionId !== currentSessionId) {
                setCurrentSessionId(result.sessionId);
            }

            let aiText = result.text || result.response || result.finalOutput || result.message || 'I processed your request.';
            let requiresPrescription = false;

            // Intercept PRESCRIPTION REQUIRED action
            const REQUIRE_ACTION = '[ACTION: REQUIRE_PRESCRIPTION]';
            if (aiText.includes(REQUIRE_ACTION)) {
                aiText = aiText.replace(REQUIRE_ACTION, '').trim();
                requiresPrescription = true;
            }

            const tools = (result.toolCalls || result.steps || []).map(step => ({
                icon: 'success',
                text: step.name || step.toolName || step,
                status: 'success'
            }));

            // Parse structured output (lists, tables, summaries)
            const structured = parseStructuredOutput(aiText);

            const aiMessage = {
                id: Date.now(),
                role: 'ai',
                text: aiText,
                tools,
                structured,
                isStreaming: true,
                isVoice: isVoiceInput, // Pass flag to determine initial delay in UI
                requiresPrescription
            };

            if (result.order || result.orderCard) {
                const o = result.order || result.orderCard;
                aiMessage.orderCard = {
                    orderId: o.orderId || o._id || 'N/A',
                    medicine: o.medicine || o.items?.map(i => i.name || i.medicine).join(', ') || 'N/A',
                    status: o.status || 'Confirmed',
                    eta: o.eta || 'Processing',
                    razorpayOrderId: o.razorpayOrderId || result.razorpayOrderId,
                    amount: o.totalAmount || o.amount || result.amount
                };
            }

            addMessage(aiMessage);

            // Only fire TTS if the user spoke to us
            if (isVoiceInput) {
                speakText(aiText);
            } else {
                // If it's a text input, we're done immediately
                setAiStatus(AI_STATUS.READY);
                // Auto-focus input for next message
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        } catch (err) {
            setTyping(false);
            setAiStatus(AI_STATUS.READY);
            addMessage({ id: Date.now(), role: 'ai', text: 'Sorry, I encountered an error. Please try again.', tools: [] });
        }
    };

    // Keep ref up to date so the mount effect can call the latest processSend
    processSendRef.current = processSend;

    // On mount: bind chat actions to store and handle pending messages
    useEffect(() => {
        // Expose critical functions to the global store so deep components can trigger them
        useAppStore.getState().setChatActions({
            processSend: (...args) => processSendRef.current?.(...args),
            setShowPrescriptionModal,
            handlePrescriptionResult: () => { } // Decommissioned function handled in UI state now
        });

        const pendingMsg = useAppStore.getState().pendingChatMessage;
        const pendingRx = useAppStore.getState().pendingPrescription;

        if (pendingMsg || pendingRx) {
            useAppStore.getState().clearPendingChatMessage();
            useAppStore.getState().clearPendingPrescription();

            if (pendingRx) {
                // Instead of sending instantly, queue it in the input preview box!
                setAttachedPreview(pendingRx.imageUrl);
                setQueuedExistingRx(pendingRx);

                // Pre-fill the input text with the user's intent 
                if (pendingMsg) {
                    setText("I want to place a new order using this prescription.");
                }
            } else if (pendingMsg) {
                // No image, just a text intent to auto-send
                const timer = setTimeout(() => {
                    processSendRef.current?.(pendingMsg);
                }, 400);
                return () => clearTimeout(timer);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = async (e) => {
        e?.preventDefault();
        if (isBusy) return;

        if (isSpeaking) {
            stopSpeaking();
        }

        if (isListening) {
            stopListening();
            return;
        }

        const userText = text.trim();
        const fileToUpload = attachedFile;
        const existingRxToUse = queuedExistingRx;
        const previewToUse = attachedPreview;

        if (!userText && !fileToUpload && !existingRxToUse) return;

        setText('');

        if (existingRxToUse) {
            setQueuedExistingRx(null);
            setAttachedPreview(null);

            addMessage({
                id: Date.now(),
                role: 'user',
                text: userText || '📎 Attached an existing prescription',
                imagePreview: previewToUse,
            });

            addMessage({
                id: Date.now() + 1,
                role: 'ai',
                text: '📄 Attached existing prescription. Sending to the pharmacy agent…',
                tools: [
                    { icon: 'success', text: 'Database Retreival', status: 'success' },
                    { icon: 'success', text: 'Active Prescription Attached', status: 'success' },
                ],
                prescriptionData: existingRxToUse,
            });

            const meds = existingRxToUse.medications || [];
            const medsString = meds.length > 0
                ? meds.map(m => `${m.name || m.medicine} (Qty: ${m.quantity || '1'}, Dosage: ${m.dosage || 'not specified'})`).join(', ')
                : "unknown medicines";

            const agentTriggerMessage = userText
                ? `I have selected my existing prescription from file, and I also asked: "${userText}". The prescription contains: ${medsString}. Please validate it and assist me in ordering.`
                : `I have selected my existing prescription from file. It contains: ${medsString}. Please help me order these and validate them using the check_prescription_on_file tool.`;

            // skip local display because we manually added a cleaner UI message above
            await processSend(agentTriggerMessage, false, previewToUse, true);

        } else if (fileToUpload) {
            setAttachedFile(null);
            setAttachedPreview(null);

            // Render user message immediately with image
            addMessage({
                id: Date.now(),
                role: 'user',
                text: userText || '📎 Attached an image',
                imagePreview: previewToUse,
            });

            setAiStatus(AI_STATUS.PROCESSING);
            setTyping(true);

            try {
                const result = await uploadPrescription(fileToUpload);
                setTyping(false);
                setAiStatus(AI_STATUS.READY);

                // If the upload failed OCR prescription detection
                if (result.isPrescription === false) {
                    addMessage({
                        id: Date.now() + 1,
                        role: 'ai',
                        text: `⚠️ ${result.message || 'This image does not appear to be a medical prescription.'}`,
                        tools: [
                            { icon: 'success', text: 'Cloudinary Upload', status: 'success' },
                            { icon: 'success', text: 'Mistral OCR', status: 'success' },
                            { icon: 'search', text: 'Not a prescription', status: 'warning' },
                        ],
                    });

                    // Still send the user's text to the AI if they typed something
                    if (userText) {
                        await processSend(userText, false, result.imageUrl, true); // True = skip local display, just DB
                    }
                    return;
                }

                const meds = result.medications || [];

                // Create AI acknowledgment message
                addMessage({
                    id: Date.now() + 1,
                    role: 'ai',
                    text: '📄 Prescription uploaded and saved. Sending to the pharmacy agent for validation…',
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

                const medsString = meds.length > 0
                    ? meds.map(m => `${m.medi_name || m.name || m.medicine} (Qty: ${m.total_quantity || m.quantity || '1'}, Dosage: ${m.dosage || 'not specified'})`).join(', ')
                    : "unknown medicines";

                // Send the AI trigger, merging the user's custom query if they typed one
                const agentTriggerMessage = userText
                    ? `I have uploaded my prescription to my file, and I also asked: "${userText}". The OCR extracted these medicines: ${medsString}. Please validate the prescription and help me order them.`
                    : `I have just uploaded my prescription to my file. The OCR extracted the following medicines: ${medsString}. Please help me order them and validate the prescription using check_prescription_on_file tool.`;

                // skip local display because we manually added the preview UI message line 368
                await processSend(agentTriggerMessage, false, result.imageUrl, true);

            } catch (err) {
                setTyping(false);
                setAiStatus(AI_STATUS.READY);
                addMessage({ id: Date.now(), role: 'ai', text: `❌ Upload failed: ${err.message}`, tools: [] });
            }
        } else if (userText) {
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

    const stopSpeaking = () => {
        cancelSpeechRef.current = true;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setCurrentAudioElement(null);
        setActiveSubtitle('');
        setAiStatus(AI_STATUS.READY);
    };

    const toggleVoice = () => {
        if (isBusy) return;
        if (isSpeaking) {
            stopSpeaking();
            return;
        }
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const getPlaceholder = () => {
        if (isListening) {
            if (selectedLanguage === 'hi') return 'सुन रहे हैं…';
            if (selectedLanguage === 'mr') return 'ऐकत आहे…';
            return "Listening to you…";
        }
        if (isProcessing) {
            if (selectedLanguage === 'hi') return 'आपकी रिक्वेस्ट प्रोसेस हो रही है…';
            if (selectedLanguage === 'mr') return 'तुमची विनंती प्रक्रिया होत आहे…';
            return "Processing your request…";
        }
        if (isSpeaking) {
            if (selectedLanguage === 'hi') return 'AI जवाब दे रही है…';
            if (selectedLanguage === 'mr') return 'AI उत्तर देत आहे…';
            return "AI is responding…";
        }
        if (selectedLanguage === 'hi') return 'अपना संदेश टाइप करें या माइक टैप करें…';
        if (selectedLanguage === 'mr') return 'तुमचा संदेश टाइप करा किंवा माइक टॅप करा…';
        return "Type your message or tap the mic…";
    };

    // ─── Direct File Upload Handler (Queue) ────────────────────────
    const handleDirectFileUpload = async (eventOrFile) => {
        let file;
        if (eventOrFile?.target?.files) {
            file = eventOrFile.target.files[0];
            eventOrFile.target.value = ''; // reset
        } else if (eventOrFile instanceof File) {
            file = eventOrFile;
        }

        if (!file) return;

        // Create preview URL and queue it instead of uploading instantly
        const previewUrl = URL.createObjectURL(file);
        setAttachedFile(file);
        setAttachedPreview(previewUrl);

        // Auto-focus input box so user can immediately start typing
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // ─── Paste Handler for Images ────────────────────────────────
    const handlePaste = (e) => {
        if (isBusy || isListening) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    e.preventDefault();
                    handleDirectFileUpload(blob);
                    break;
                }
            }
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

            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: [1, 1.03, 1] }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-x-4 -bottom-2 h-16 bg-cyan-500/20 blur-2xl rounded-full z-0 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Queued Image Preview Area */}
            <AnimatePresence>
                {attachedPreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="relative w-24 h-24 mb-3 ml-4 rounded-xl overflow-hidden border-2 border-primary/20 bg-black/5 dark:bg-white/5 shadow-sm group"
                    >
                        <img src={attachedPreview} alt="Attached Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => {
                                setAttachedFile(null);
                                setAttachedPreview(null);
                                setQueuedExistingRx(null);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                            <span className="sr-only">Remove</span>
                            &times;
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <form
                id="chat-form"
                onSubmit={handleSend}
                className={`relative z-10 flex items-center gap-2 sm:gap-3 w-full bg-card/90 backdrop-blur-xl border rounded-full p-2 pr-3 transition-all duration-500 overflow-hidden ${isListening
                    ? 'ring-2 ring-primary/60 border-primary/30 shadow-[0_8px_32px_rgba(37,99,235,0.15)]'
                    : isBusy
                        ? 'border-black/5 dark:border-white/5 opacity-80 shadow-sm'
                        : 'border-black/10 dark:border-white/10 shadow-lg hover:shadow-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30'
                    }`}
            >
                {/* Camera Button — opens camera modal */}
                <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(true)}
                    disabled={isBusy || isListening}
                    title="Scan Prescription"
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300
                        ${isBusy || isListening
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary'
                        }`}
                >
                    <Camera className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>

                {/* File Upload Button — direct file picker */}
                <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    disabled={isBusy || isListening}
                    title="Upload Prescription Image"
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300
                        ${isBusy || isListening
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-primary/10 hover:text-primary'
                        }`}
                >
                    <Paperclip className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
                <input
                    ref={fileUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDirectFileUpload}
                    className="hidden"
                />

                <motion.button
                    whileHover={{ scale: isBusy ? 1 : 1.05 }}
                    whileTap={{ scale: isBusy ? 1 : 0.95 }}
                    type="button"
                    onClick={toggleVoice}
                    disabled={isBusy}
                    className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-colors duration-300 relative ${isListening || isSpeaking
                        ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        : isBusy
                            ? 'bg-black/5 dark:bg-white/5 text-text-muted opacity-50 cursor-not-allowed'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text'
                        }`}
                >
                    {isListening ? (
                        <>
                            <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-40" />
                            <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        </>
                    ) : isSpeaking ? (
                        <>
                            <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        </>
                    ) : isBusy ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </motion.button>

                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={getPlaceholder()}
                    disabled={isListening || isBusy}
                    className="flex-1 w-0 min-w-0 bg-transparent border-none focus:outline-none text-[14px] sm:text-[15px] px-1 sm:px-2 text-text placeholder:text-text-muted/50 disabled:opacity-60 transition-opacity duration-300"
                />

                <button
                    type="submit"
                    disabled={(!text.trim() && !isListening) || isBusy}
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ${(text.trim() || isListening) && !isBusy
                        ? 'bg-primary text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-transparent text-text-muted opacity-40 cursor-default'
                        }`}
                >
                    {isListening ? (
                        <div className="flex gap-1">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-bounce" />
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    // Queue the camera capture the same way we queue file uploads
                    setAttachedPreview(capturedPreviewUrl || result.imageUrl);
                    // Usually the camera returns a blob. For now, since it already uploaded internally
                    // to cloudinary in PrescriptionUpload, we might need a workaround. 
                    // To keep UX smooth, we will trigger the AI acknowledgment immediately for camera since it uploads directly inside the modal.

                    addMessage({
                        id: Date.now(),
                        role: 'user',
                        text: '📷 Captured a prescription image',
                        imagePreview: capturedPreviewUrl || result.imageUrl,
                    });

                    const meds = result.medications || [];
                    addMessage({
                        id: Date.now() + 1,
                        role: 'ai',
                        text: '📄 Prescription uploaded and saved. Sending to the pharmacy agent for validation…',
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
                    const medsString = meds.length > 0
                        ? meds.map(m => `${m.medi_name || m.name || m.medicine} (Qty: ${m.total_quantity || m.quantity || '1'}, Dosage: ${m.dosage || 'not specified'})`).join(', ')
                        : "unknown medicines";

                    const agentMessage = `I have just captured and uploaded my prescription to my file. The OCR extracted these medicines: ${medsString}. Please help me order them and validate the prescription using check_prescription_on_file tool.`;
                    processSend(agentMessage);
                }}
            />
        </div>
    );
};

export default InputArea;

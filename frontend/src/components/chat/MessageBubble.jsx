import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Search, Loader2 } from 'lucide-react';
import OrderCard from './OrderCard';
import StructuredRenderer from './StructuredRenderer';
import MarkdownText from './MarkdownText';
import PrescriptionCard from '../../features/prescription/PrescriptionCard';
import InlinePrescriptionSelector from '../../features/prescription/InlinePrescriptionSelector';

const TypewriterText = ({ text, delayStart = 800, typingSpeed = 20, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        let timeout;
        if (delayStart > 0) {
            timeout = setTimeout(() => {
                setStarted(true);
            }, delayStart);
        } else {
            setStarted(true);
        }
        return () => clearTimeout(timeout);
    }, [delayStart]);

    useEffect(() => {
        if (!started || !text) return;

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length - 1) {
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                setDisplayedText(text);
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, typingSpeed);

        return () => clearInterval(interval);
    }, [text, started, typingSpeed, onComplete]);

    if (!started) {
        return (
            <div className="flex items-center gap-1.5 h-[22px] text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        );
    }

    return (
        <div className="relative">
            <MarkdownText text={displayedText} />
            {started && displayedText !== text && (
                <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle shadow-[0_0_8px_theme('colors.cyan.400')]" />
            )}
        </div>
    );
};

const ToolExecutionBadge = ({ tool, index }) => {
    const icons = {
        search: <Search className="w-3.5 h-3.5" />,
        validate: <ShieldCheck className="w-3.5 h-3.5" />,
        success: <CheckCircle2 className="w-3.5 h-3.5" />,
        loading: <Loader2 className="w-3.5 h-3.5 animate-spin" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.25 }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border
                ${tool.status === 'success'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                    : 'bg-primary/5 text-primary border-primary/10'
                }`}
        >
            {icons[tool.icon] || icons.success}
            {tool.text}
        </motion.div>
    );
};

const MessageBubble = ({ message }) => {
    const isAi = message.role === 'ai';

    // ── Priority 1: Structured output
    // When detected, render ONLY the structured component — no text bubble.
    const hasStructured = isAi && !!message.structured;

    // ── Priority 2: Streaming (typewriter in bubble)
    // Only happens during live stream; structured won't exist yet.
    const isStreaming = isAi && message.isStreaming;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}
        >
            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[78%] ${isAi ? 'items-start' : 'items-end'}`}>

                {/* Tool Executions (Only for AI) */}
                {isAi && message.tools && message.tools.length > 0 && (
                    <div className="flex flex-col gap-1.5 ml-2">
                        {message.tools.map((tool, idx) => (
                            <ToolExecutionBadge key={idx} tool={tool} index={idx} />
                        ))}
                    </div>
                )}

                {/* ─── STRUCTURED OUTPUT PRIORITY ───────────────────────────── */}
                {/* When structured data exists: suppress text bubble entirely  */}
                {hasStructured ? (
                    <div className="text-text">
                        <StructuredRenderer messageId={message.id} structured={message.structured} />
                    </div>
                ) : (
                    /* ─── TEXT BUBBLE (streaming or plain) ─────────────────── */
                    <div className={`
                        relative px-5 py-4 text-[15px] leading-relaxed overflow-hidden w-fit
                        ${isAi
                            ? 'rounded-3xl rounded-tl-sm bg-glass backdrop-blur-md text-text border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                            : 'rounded-3xl rounded-tr-sm bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-soft font-medium'
                        }
                    `}>
                        {/* Image Preview (uploaded prescription) */}
                        {message.imagePreview && (
                            <div className="mb-3 -mx-1 -mt-1">
                                <img
                                    src={message.imagePreview}
                                    alt="Prescription"
                                    className="w-full max-h-48 object-cover rounded-xl border border-white/20"
                                />
                            </div>
                        )}

                        {isStreaming ? (
                            /* Streaming: typewriter effect */
                            <TypewriterText
                                text={message.text}
                                delayStart={message.isVoice ? 800 : 0}
                                typingSpeed={message.isVoice ? 30 : 15}
                            />
                        ) : isAi ? (
                            /* AI completed message: markdown rendering */
                            <MarkdownText text={message.text} />
                        ) : (
                            /* User message: plain text */
                            message.text
                        )}

                        {/* Subtle shimmer on AI messages */}
                        {isAi && (
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_1] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none rounded-3xl overflow-hidden" />
                        )}

                        {/* Inline Prescription Selector */}
                        {isAi && message.requiresPrescription && (
                            <div className="mt-2 text-text">
                                <InlinePrescriptionSelector />
                            </div>
                        )}
                    </div>
                )}

                {/* Optional Order Confirmation Extension */}
                {isAi && message.orderCard && (
                    <div className="mt-2 text-text">
                        <OrderCard details={message.orderCard} />
                    </div>
                )}

                {/* Optional Prescription Card */}
                {isAi && message.prescriptionData && (
                    <PrescriptionCard data={message.prescriptionData} />
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;

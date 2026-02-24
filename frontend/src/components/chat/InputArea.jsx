import React, { useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { sendChatMessage } from '../../services/api';

const InputArea = () => {
    const [text, setText] = useState('');
    const { addMessage, aiStatus, setAiStatus, setTyping } = useAppStore();

    const isListening = aiStatus === AI_STATUS.LISTENING;

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!text.trim() && !isListening) return;

        if (isListening) {
            setAiStatus(AI_STATUS.READY);
            return;
        }

        const userText = text.trim();
        setText('');

        // Add user message
        addMessage({ id: Date.now(), role: 'user', text: userText });

        // Show processing state
        setAiStatus(AI_STATUS.PROCESSING);
        setTyping(true);

        try {
            const result = await sendChatMessage(userText);

            setTyping(false);
            setAiStatus(AI_STATUS.SPEAKING);

            // Parse the AI response — the backend returns the orchestrator result
            const aiText = result.response || result.finalOutput || result.message || JSON.stringify(result);

            // Extract tool steps if present
            const tools = (result.toolCalls || result.steps || []).map(step => ({
                icon: 'success',
                text: step.toolName || step.name || step,
                status: 'success'
            }));

            const aiMessage = { id: Date.now(), role: 'ai', text: aiText, tools };

            // If the result contains an order, attach an order card
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

            setTimeout(() => setAiStatus(AI_STATUS.READY), 3000);
        } catch (err) {
            setTyping(false);
            setAiStatus(AI_STATUS.READY);
            addMessage({ id: Date.now(), role: 'ai', text: `Sorry, I encountered an error: ${err.message}. Please try again.`, tools: [] });
        }
    };

    const toggleVoice = () => {
        if (isListening) {
            setAiStatus(AI_STATUS.READY);
        } else {
            setAiStatus(AI_STATUS.LISTENING);
            // Demo: simulate voice transcription
            setTimeout(() => {
                setText("Could you order a refill of my Metformin?");
                setTimeout(() => {
                    setAiStatus(AI_STATUS.PROCESSING);
                    // Trigger send via form submit
                    document.querySelector('#chat-form')?.requestSubmit();
                }, 1500);
            }, 2000);
        }
    };


    return (
        <div className="relative w-full pb-4">
            {/* Glow effect when listening */}
            {isListening && (
                <div className="absolute inset-x-2 inset-y-0 -bottom-4 bg-primary/20 blur-xl rounded-full z-0 transition-all duration-500" />
            )}

            <form
                id="chat-form"
                onSubmit={handleSend}
                className={`relative z-10 flex items-center gap-3 w-full bg-card border border-black/5 dark:border-white/5 rounded-[2rem] p-2 pr-3 shadow-soft transition-all duration-300
          ${isListening ? 'ring-2 ring-primary bg-bg' : 'focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10'}
        `}
            >
                <button
                    type="button"
                    onClick={toggleVoice}
                    className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 relative
            ${isListening
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-text'
                        }
          `}
                >
                    {isListening ? (
                        <>
                            <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-40"></span>
                            <Square className="w-5 h-5 fill-current" />
                        </>
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Type your message..."}
                    disabled={isListening}
                    className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-[15px] px-2 text-text placeholder:text-text-muted/60 disabled:opacity-70"
                />

                <button
                    type="submit"
                    disabled={!text.trim() && !isListening}
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
            ${text.trim() || isListening
                            ? 'bg-primary text-white hover:bg-blue-700'
                            : 'bg-transparent text-text-muted opacity-50'
                        }
          `}
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
                <p className="text-[11px] text-text-muted font-medium opacity-60">AI can make mistakes. Please verify medical information.</p>
            </div>
        </div>
    );
};

export default InputArea;

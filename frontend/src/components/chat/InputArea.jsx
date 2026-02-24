import React, { useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';

const InputArea = () => {
    const [text, setText] = useState('');
    const { addMessage, aiStatus, setAiStatus, setTyping, updateLastAiMessageTool } = useAppStore();

    const isListening = aiStatus === AI_STATUS.LISTENING;

    const handleSend = (e) => {
        e?.preventDefault();
        if (!text.trim() && !isListening) return;

        if (isListening) {
            // Stop listening manually
            setAiStatus(AI_STATUS.READY);
            return;
        }

        // Add user message
        addMessage({ id: Date.now(), role: 'user', text: text.trim() });
        setText('');

        // Simulate AI Processing and Tool Calls
        simulateAiResponse();
    };

    const toggleVoice = () => {
        if (isListening) {
            setAiStatus(AI_STATUS.READY);
        } else {
            setAiStatus(AI_STATUS.LISTENING);
            // Mocking transcription...
            setTimeout(() => {
                setText("Could you order a refill of my Metformin?");
                setTimeout(() => {
                    setAiStatus(AI_STATUS.PROCESSING);
                    handleSend(); // Auto send after voice input
                }, 1500);
            }, 2000);
        }
    };

    const simulateAiResponse = () => {
        setAiStatus(AI_STATUS.PROCESSING);
        setTyping(true);

        setTimeout(() => {
            // Add empty AI message first to append tools to
            addMessage({ id: Date.now(), role: 'ai', text: '', tools: [] });
            let currentToolCount = 0;

            // Simulate step 1
            setTimeout(() => {
                updateLastAiMessageTool({ icon: 'search', text: 'Checking inventory for Metformin 500mg...', status: 'loading' });
            }, 500);

            // Simulate step 2
            setTimeout(() => {
                // Update previous to success implicitly or just add next
                updateLastAiMessageTool({ icon: 'validate', text: 'Validating prescription...', status: 'loading' });
            }, 1500);

            // Simulate final response
            setTimeout(() => {
                setTyping(false);
                setAiStatus(AI_STATUS.SPEAKING);

                // Update the actual message text and add order card
                useAppStore.setState(state => {
                    const newMessages = [...state.messages];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.text = "I've checked our stock and validated your prescription. I've successfully placed a refill order for your Metformin 500mg. It will be dispatched soon.";
                    lastMsg.orderCard = {
                        orderId: 'ORD-' + Math.floor(Math.random() * 90000 + 10000),
                        medicine: 'Metformin 500mg (60 Tabs)',
                        status: 'Confirmed',
                        eta: 'Tomorrow, 2:00 PM'
                    };
                    // Replace tools to show final success states for simplicity in mock
                    lastMsg.tools = [
                        { icon: 'success', text: 'Stock validated', status: 'success' },
                        { icon: 'success', text: 'Prescription verified', status: 'success' }
                    ];
                    return { messages: newMessages };
                });

                setTimeout(() => {
                    setAiStatus(AI_STATUS.READY);
                }, 4000); // Time it takes to "speak"

            }, 3000);

        }, 500);
    };


    return (
        <div className="relative w-full pb-4">
            {/* Glow effect when listening */}
            {isListening && (
                <div className="absolute inset-x-2 inset-y-0 -bottom-4 bg-primary/20 blur-xl rounded-full z-0 transition-all duration-500" />
            )}

            <form
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

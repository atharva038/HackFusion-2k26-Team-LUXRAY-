import { useState } from 'react';
import Header from '../../components/layout/Header';
import AiAvatar from '../../components/avatar/AiAvatar';
import ChatArea from '../../components/chat/ChatArea';
import ChatSidebar from '../../components/chat/ChatSidebar';
import useAppStore from '../../store/useAppStore';
import MyOrders from '../user/MyOrders';
import MyPrescriptions from '../user/MyPrescriptions';
import { X } from 'lucide-react';

const ChatPage = ({ onOpenAllergies }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isChatEmpty        = useAppStore((state) => state.messages.length === 0);
    const activeSlideOver    = useAppStore((state) => state.activeSlideOver);
    const setActiveSlideOver = useAppStore((state) => state.setActiveSlideOver);

    return (
        <div className="flex flex-col h-dvh w-full overflow-hidden bg-transparent text-text transition-colors duration-500">
            <Header
                onOpenAllergies={onOpenAllergies}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="flex-1 flex w-full h-[calc(100dvh-4rem)] mx-auto overflow-hidden relative bg-transparent">

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-90 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Nav sidebar */}
                <div className={`
                    fixed md:relative top-0 md:top-auto bottom-0 left-0 z-100 md:z-50
                    transform transition-all duration-300 ease-in-out
                    ${sidebarOpen
                        ? 'translate-x-0 w-[75vw] sm:w-75 md:w-80'
                        : '-translate-x-full w-[75vw] sm:w-75 md:w-0 md:opacity-0 md:overflow-hidden'}
                    h-dvh md:h-full shadow-2xl md:shadow-none bg-glass backdrop-blur-lg border-r border-white/10
                `}>
                    <div className="w-full h-full pt-4 md:pt-0">
                        <ChatSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>

                {/* ══════════════════════════════════
                    MAIN CONTENT AREA
                ══════════════════════════════════ */}
                <div className="flex-1 flex min-w-0 h-full relative z-0">

                    {/* ── Left panel: compact avatar (chat active, desktop) ── */}
                    <aside
                        className={`
                            hidden md:flex flex-col items-center shrink-0
                            border-r border-white/5
                            transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                            ${!isChatEmpty
                                ? 'w-72 justify-start pt-10 pb-6 px-5 opacity-100'
                                : 'w-0 overflow-hidden opacity-0 pointer-events-none px-0'}
                        `}
                    >
                        {!isChatEmpty && <AiAvatar compact={false} />}
                    </aside>

                    {/* ── Right column ── */}
                    <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

                        {/* CENTERED AVATAR (empty state, desktop) */}
                        <div
                            className={`
                                absolute inset-0 z-20
                                hidden md:flex flex-col items-center justify-center gap-6
                                pointer-events-none
                                transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                                ${isChatEmpty
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 -translate-y-8'}
                            `}
                        >
                            {/* Soft radial glow behind avatar */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
                            </div>

                            <div className="pointer-events-auto flex flex-col items-center">
                                <AiAvatar compact={false} />
                            </div>

                            {/* Hint text */}
                            <p className="pointer-events-auto text-sm text-text-muted text-center max-w-xs leading-relaxed">
                                Your AI-powered pharmacist is ready.<br />
                                <span className="text-text-muted/60">Type a message to get started.</span>
                            </p>
                        </div>

                        {/* Mobile: compact avatar strip */}
                        <div className="md:hidden flex items-center gap-3 px-4 pt-3 pb-2 border-b border-white/5 bg-linear-to-b from-bg/80 to-transparent shrink-0">
                            <AiAvatar compact={true} />
                        </div>

                        {/* Chat area — centered in column */}
                        <section className="flex-1 h-full flex flex-col relative z-10 overflow-hidden">
                            <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
                                <ChatArea />
                            </div>
                        </section>
                    </div>

                    {/* ── Contextual Slide-Over ── */}
                    <div className={`
                        absolute inset-y-0 right-0 z-60
                        w-full md:w-200
                        bg-card/95 backdrop-blur-3xl border-l border-white/10
                        flex flex-col
                        transform transition-all duration-500 ease-in-out
                        ${activeSlideOver
                            ? 'translate-x-0 opacity-100 pointer-events-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)]'
                            : 'translate-x-full opacity-0 pointer-events-none shadow-none'}
                    `}>
                        {activeSlideOver && (
                            <>
                                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-cyan-900/20">
                                    <h2 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">
                                        {activeSlideOver === 'my-orders' ? 'My Orders' : 'My Prescriptions'}
                                    </h2>
                                    <button
                                        onClick={() => setActiveSlideOver(null)}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    {activeSlideOver === 'my-orders'        && <MyOrders        isSlideOver={true} />}
                                    {activeSlideOver === 'my-prescriptions' && <MyPrescriptions isSlideOver={true} />}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ChatPage;

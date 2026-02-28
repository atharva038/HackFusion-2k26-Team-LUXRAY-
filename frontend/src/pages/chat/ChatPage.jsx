import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import AiAvatar from '../../components/avatar/AiAvatar';
import ChatArea from '../../components/chat/ChatArea';
import ChatSidebar from '../../components/chat/ChatSidebar';
import useAppStore from '../../store/useAppStore';

const ChatPage = ({ onOpenAllergies }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isChatEmpty = useAppStore((state) => state.messages.length === 0);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-bg text-text transition-colors duration-500">
            {/* Minimal Header */}
            <Header
                onOpenAllergies={onOpenAllergies}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="flex-1 flex w-full h-[calc(100vh-4rem)] max-w-[1600px] mx-auto overflow-hidden relative bg-bg">

                {/* Sidebar Overlay (Mobile) */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar: Navigation & History */}
                <div className={`
                    absolute md:relative inset-y-0 left-0 z-50
                    transform transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 md:w-80' : '-translate-x-full md:w-0 md:opacity-0 md:overflow-hidden'}
                    h-full shadow-2xl md:shadow-none bg-bg
                `}>
                    <div className="w-80 h-full">
                        <ChatSidebar />
                    </div>
                </div>

                {/* Right Area: Main Chat Experience */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
                    {/* Centered or Top Fixed AI Orb */}
                    <div className={`
                        absolute left-0 right-0 z-30 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none
                        ${isChatEmpty ? 'top-[40%] -translate-y-1/2 scale-125' : 'top-0 pb-4 bg-gradient-to-b from-bg via-bg/80 to-transparent scale-100'}
                    `}>
                        <div className="pointer-events-auto flex items-center justify-center">
                            <AiAvatar />
                        </div>
                    </div>

                    {/* Chat Stream Data */}
                    <section className={`flex-1 h-full flex flex-col relative bg-bg transition-all duration-700 z-10 ${isChatEmpty ? 'pt-0' : 'pt-20'}`}>
                        <ChatArea />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ChatPage;

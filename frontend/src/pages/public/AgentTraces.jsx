import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Box, BrainCircuit, ShieldAlert, Cpu, ArrowRight, Server, Repeat, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/layout/Header';

const ACTION_ICONS = {
    'AI Reasoning': <BrainCircuit className="w-4 h-4 text-purple-500" />,
    '⚙️ Tool: order_medicine': <Box className="w-4 h-4 text-amber-500" />,
    '⚙️ Tool: create_payment': <Activity className="w-4 h-4 text-green-500" />,
    '⚙️ Tool: check_prescription_on_file': <ShieldAlert className="w-4 h-4 text-red-500" />,
    '🤝 Handoff': <ArrowRight className="w-4 h-4 text-blue-500" />,
    '💬 Response': <Activity className="w-4 h-4 text-indigo-500" />,
    '📦 Result: order_medicine': <Box className="w-4 h-4 text-amber-500" />,
    '📦 Result: create_payment': <Activity className="w-4 h-4 text-green-500" />,
    '📦 Result: check_prescription_on_file': <ShieldAlert className="w-4 h-4 text-red-500" />,
    'Using Tool: executeImageExtraction': <Server className="w-4 h-4 text-cyan-500" />,
    'Tool Result: executeImageExtraction': <Server className="w-4 h-4 text-cyan-500" />,
    'Final Structuring': <Box className="w-4 h-4 text-indigo-500" />,
    'default': <Cpu className="w-4 h-4 text-gray-400" />
};

export default function AgentTraces() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTraces = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/traces`);
            if (!res.ok) throw new Error('Failed to load traces');
            const data = await res.json();
            setLogs(data.traces || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setIsRefreshing(false), 500); // UI feel
        }
    };

    useEffect(() => {
        fetchTraces();
        // Auto-refresh every 10 seconds for a "live monitor" feel
        const interval = setInterval(fetchTraces, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !logs.length) {
        return (
            <div className="min-h-screen bg-bg text-text p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-text-muted font-medium">Connecting to AI Neural Link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg text-text p-8 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Monitor Connection Lost</h2>
                <p className="text-text-muted">{error}</p>
                <button 
                    onClick={fetchTraces}
                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text font-sans selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-5%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <Header />
            <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex-1 relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-10 relative">
                    {/* Decorative bottom line */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent"></div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
                                <Terminal className="w-7 h-7 text-indigo-500" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
                                System Trace Monitor
                            </h1>
                        </div>
                        <p className="text-text-muted max-w-2xl text-base md:text-lg pl-1 font-medium opacity-90">
                            Real-time observability into the multi-agent neural network's cognition, tool orchestration, and routing decisions.
                        </p>
                    </div>
                    
                    <button 
                        onClick={fetchTraces}
                        disabled={isRefreshing}
                        className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-card border border-black/10 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 rounded-xl text-sm font-semibold transition-all duration-300 w-fit disabled:opacity-50 shadow-sm hover:shadow-md text-indigo-600 dark:text-indigo-400"
                    >
                        <Repeat className={`w-4.5 h-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Syncing...' : 'Live Sync'}
                    </button>
                </div>

                {/* Logs Feed */}
                <div className="space-y-8">
                    <AnimatePresence>
                        {logs.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="text-center py-20 text-text-muted border border-dashed border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm rounded-3xl"
                            >
                                <BrainCircuit className="w-12 h-12 mx-auto mb-4 text-indigo-500 opacity-50 animate-pulse" />
                                <p className="text-lg font-medium">No agent traces found in the database.</p>
                                <p className="text-sm opacity-70 mt-2">Interact with the AI to generate cognitive traces.</p>
                            </motion.div>
                        ) : (
                            logs.map((log) => (
                                <TraceCard key={log._id} log={log} />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

const TraceCard = ({ log }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine overall status color and glow
    const statusColor = 
        log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
        log.status === 'blocked' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="group rounded-2xl border border-black/5 dark:border-white/10 bg-card/80 backdrop-blur-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500"
        >
            {/* Run Header (Clickable to toggle) */}
            <div 
                className={`px-6 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer transition-colors duration-300 ${isExpanded ? 'bg-indigo-500/5' : 'bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent hover:bg-black/5 dark:hover:bg-white/5'} border-b border-black/5 dark:border-white/5`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${statusColor}`}></span>
                        <h3 className="font-bold text-text tracking-widest uppercase text-[12px] opacity-90">
                            {log.sessionId === 'prescription_upload' ? 'OCR Extraction Pipeline' : 'Chat Intelligence Routing'}
                        </h3>
                    </div>
                    <p className="text-[14px] md:text-[15px] font-medium text-text bg-black/5 dark:bg-white/5 w-fit px-3 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors border border-black/5 dark:border-white/5 italic">
                        "{log.userMessage}"
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-[13px] font-mono text-text-muted mt-2 sm:mt-0">
                    <span className="flex items-center gap-2 shrink-0 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        {log.durationMs}ms
                    </span>
                    <span className="flex items-center gap-2 shrink-0 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    <div className={`ml-2 w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/5 shadow-sm transition-all duration-300 ${isExpanded ? 'bg-indigo-500 text-white border-indigo-500' : 'group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {/* Trace Steps / Timeline (Animated Dropdown) */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden bg-black/[0.02] dark:bg-black/20"
                    >
                        <div className="p-6 md:p-8 font-mono text-[13px]">
                            <div className="relative pl-6 space-y-8 before:absolute before:inset-y-3 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-indigo-500/30 before:via-purple-500/30 before:to-transparent rounded">
                                {log.traces.map((trace, idx) => {
                                    const icon = ACTION_ICONS[trace.action] || ACTION_ICONS[trace.action.replace(/:.*/, ':')] || ACTION_ICONS['default'];
                                    
                                    return (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 + 0.1 }}
                                            className="relative"
                                        >
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[35px] mt-[2px] bg-card p-1.5 rounded-full border border-black/10 dark:border-white/10 z-10 shadow-sm ring-4 ring-bg">
                                                {icon}
                                            </div>
                                            
                                            <div className="space-y-2.5 w-full overflow-hidden">
                                                <div className="flex flex-wrap items-center gap-2.5 text-text opacity-90 text-[14px]">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20 shadow-sm">{trace.agent}</span>
                                                    <span className="text-text-muted/40 font-sans">→</span>
                                                    <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-500/5 px-2.5 py-0.5 rounded-md border border-purple-500/10">
                                                        {trace.action}
                                                    </span>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-[#111111] rounded-xl p-4 md:p-5 text-text-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-black/5 dark:border-white/5 whitespace-pre-wrap break-words max-h-72 overflow-y-auto w-full custom-scrollbar leading-relaxed">
                                                    {formatData(trace.data)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Final Answer Footer */}
            {log.agentResponse && log.sessionId !== 'prescription_upload' && (
                <div className="px-6 md:px-8 py-5 border-t border-black/5 dark:border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                    <h4 className="text-[12px] font-bold tracking-widest mb-2.5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 uppercase">
                        <CheckCircle2Icon status={log.status} /> Final Dispatch
                    </h4>
                    <p className="text-[15px] leading-relaxed text-text font-sans opacity-95">
                        {log.agentResponse}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

// Helper to format unstructured trace data beautifully
const formatData = (data) => {
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return data;
        }
    }
    return JSON.stringify(data, null, 2);
};

const CheckCircle2Icon = ({ status }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="14" height="14" 
        viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className={status === 'success' ? 'text-green-500' : 'text-amber-500'}
    >
        <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

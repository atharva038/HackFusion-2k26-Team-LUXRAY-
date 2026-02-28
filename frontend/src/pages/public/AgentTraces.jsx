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
        <div className="min-h-screen bg-bg text-text font-sans selection:bg-indigo-500/30 font-sans">
            <Header />
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex-1">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Terminal className="w-6 h-6 text-indigo-500" />
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Trace Monitor</h1>
                        </div>
                        <p className="text-text-muted max-w-xl text-sm md:text-base">
                            Real-time observation deck into the AI Agent's decision-making process, tool executions, and internal reasoning chains.
                        </p>
                    </div>
                    
                    <button 
                        onClick={fetchTraces}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm font-medium transition-all w-fit disabled:opacity-50"
                    >
                        <Repeat className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Syncing...' : 'Live Sync'}
                    </button>
                </div>

                {/* Logs Feed */}
                <div className="space-y-8">
                    <AnimatePresence>
                        {logs.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="text-center py-16 text-text-muted border border-dashed border-black/10 dark:border-white/10 rounded-2xl"
                            >
                                <BrainCircuit className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p>No agent traces found in the database.</p>
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

    // Determine overall status color
    const statusColor = 
        log.status === 'success' ? 'bg-green-500' :
        log.status === 'blocked' ? 'bg-amber-500' : 'bg-red-500';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-card overflow-hidden shadow-sm"
        >
            {/* Run Header (Clickable to toggle) */}
            <div 
                className="px-5 py-4 bg-primary/5 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shadow-sm animate-pulse ${statusColor}`}></span>
                        <h3 className="font-semibold text-text tracking-wide uppercase text-[11px] opacity-80">
                            {log.sessionId === 'prescription_upload' ? 'OCR Extraction Pipeline' : 'Chat Intelligence Routing'}
                        </h3>
                    </div>
                    <p className="text-[13px] font-medium text-text bg-black/5 dark:bg-white/5 w-fit px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                        "{log.userMessage}"
                    </p>
                </div>
                
                
                <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
                    <span className="flex items-center gap-1.5 shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                        {log.durationMs}ms
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                    <div className="ml-2 text-text-muted/60">
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
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 font-mono text-[13px] bg-black/5 dark:bg-black/20">
                            <div className="relative pl-4 space-y-6 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-black/10 dark:before:bg-white/10 rounded">
                                {log.traces.map((trace, idx) => {
                                    const icon = ACTION_ICONS[trace.action] || ACTION_ICONS[trace.action.replace(/:.*/, ':')] || ACTION_ICONS['default'];
                                    
                                    return (
                                        <div key={idx} className="relative">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[27px] mt-[3px] bg-card p-[2px] rounded-full border border-black/10 dark:border-white/10 z-10 shadow-sm">
                                                {icon}
                                            </div>
                                            
                                            <div className="space-y-1.5 w-full overflow-hidden">
                                                <div className="flex items-center gap-2 text-text opacity-90">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{trace.agent}</span>
                                                    <span className="text-text-muted/60">→</span>
                                                    <span className="font-semibold">{trace.action}</span>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 text-text-muted shadow-sm border border-black/5 dark:border-white/5 whitespace-pre-wrap break-words max-h-48 overflow-y-auto w-full custom-scrollbar">
                                                    {formatData(trace.data)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Final Answer Footer */}
            {log.agentResponse && log.sessionId !== 'prescription_upload' && (
                <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 bg-primary/5">
                    <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2Icon status={log.status} /> Final Dispatch
                    </h4>
                    <p className="text-sm text-text font-sans opacity-90">
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

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Box, BrainCircuit, ShieldAlert, Cpu, ArrowRight, Server, Repeat, Terminal, Search, Code, KeyRound, Workflow, Play, FileJson } from 'lucide-react';

const ACTION_ICONS = {
    '🤖 AI Reasoning / Response': <BrainCircuit className="w-4 h-4 text-pink-500" />,
    '🤖 AI Reasoning': <BrainCircuit className="w-4 h-4 text-purple-500" />,
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

export default function AdminTraces() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Master-Detail State
    const [selectedTraceId, setSelectedTraceId] = useState(null);

    const fetchTraces = async () => {
        setIsRefreshing(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const baseUrl = apiUrl.replace(/\/api\/?$/, '');
            const res = await fetch(`${baseUrl}/api/traces`);
            if (!res.ok) throw new Error('Failed to load traces');
            const data = await res.json();
            setLogs(data.traces || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => {
        fetchTraces();
        const interval = setInterval(() => {
            if (!selectedTraceId) {
                fetchTraces(); // Auto-refresh only if not looking at a detail view
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedTraceId]);

    const selectedTrace = logs.find(l => l._id === selectedTraceId);

    if (loading && !logs.length) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full bg-bg">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-text-muted font-medium">Connecting to trace server...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card h-full font-sans">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-text">Trace Server Unreachable</h2>
                <p className="text-text-muted">{error}</p>
                <button onClick={fetchTraces} className="mt-6 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-sm">
                    Retry Connection
                </button>
            </div>
        );
    }

    // Detail view active
    if (selectedTrace) {
        return <TraceDetailView trace={selectedTrace} onBack={() => setSelectedTraceId(null)} />;
    }

    return (
        <div className="flex flex-col h-full w-full bg-bg font-sans overflow-hidden">
            {/* Master View Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5 bg-card/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Workflow className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-text leading-tight">Observable Traces</h1>
                        <p className="text-xs text-text-muted font-medium">Langfuse-style run monitoring</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search traces (ID, user, query)..." 
                            className="bg-bg border border-black/5 dark:border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-primary/50 text-text transition-colors"
                        />
                    </div>
                    <button
                        onClick={fetchTraces}
                        disabled={isRefreshing}
                        className="flex items-center justify-center w-8 h-8 bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-text-muted transition-colors"
                    >
                        <Repeat className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Traces Table / List */}
            <div className="flex-1 overflow-auto bg-card">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Terminal className="w-12 h-12 text-black/10 dark:text-white/10 mb-4" />
                        <h2 className="text-base font-semibold text-text mb-1">No Traces Yet</h2>
                        <p className="text-sm text-text-muted">Once agents execute tasks, their execution graphs will appear here.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-bg/50 sticky top-0 z-10 text-xs uppercase tracking-wider text-text-muted font-semibold border-y border-black/5 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Time (ms)</th>
                                <th className="px-6 py-3 font-medium">Input Query</th>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Created At</th>
                                <th className="px-6 py-3 font-medium">Steps</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {logs.map((log) => {
                                const isSuccess = log.status === 'success';
                                const isBlocked = log.status === 'blocked';
                                
                                return (
                                    <tr 
                                        key={log._id} 
                                        onClick={() => setSelectedTraceId(log._id)}
                                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : isBlocked ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                <span className={`font-medium ${isSuccess ? 'text-emerald-700 dark:text-emerald-400' : isBlocked ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-text bg-bg px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                                                {log.durationMs}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm truncate text-text font-medium group-hover:text-primary transition-colors">
                                            {log.userMessage}
                                        </td>
                                        <td className="px-6 py-4 text-text-muted text-xs font-mono">
                                            {log.userName || log.userId}
                                        </td>
                                        <td className="px-6 py-4 text-text-muted">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                                                {log.traces?.length || 0} nodes
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const TraceDetailView = ({ trace, onBack }) => {
    // Left pane active step
    const [activeStepIdx, setActiveStepIdx] = useState(0);

    const activeStep = trace.traces?.[activeStepIdx] || null;

    return (
        <div className="flex flex-col h-full w-full bg-bg font-sans overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-text-muted transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="h-5 w-px bg-black/10 dark:bg-white/10 mx-1" />
                    <span className="font-mono text-xs text-text-muted">Run ID: {trace._id}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-text-muted bg-bg/50 px-3 py-1.5 rounded-md border border-black/5 dark:border-white/5">
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {trace.durationMs}ms</span>
                    <div className="h-3 w-px bg-black/10 dark:bg-white/10" />
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(trace.createdAt).toLocaleString()}</span>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Waterfall / Step Tree */}
                <div className="w-1/3 min-w-[300px] border-r border-black/5 dark:border-white/5 flex flex-col bg-card/30">
                    <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 shrink-0 bg-card">
                        <h2 className="text-xs font-semibold text-text uppercase tracking-wider">Execution Graph</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="relative pl-6 space-y-4 before:absolute before:inset-y-3 before:left-[11px] before:w-[2px] before:bg-black/5 dark:before:bg-white/5 rounded">
                            
                            {/* Input Node */}
                            <div className="relative">
                                <div className="absolute -left-[30px] w-[6px] h-[6px] rounded-full bg-black/20 dark:bg-white/20 mt-[8px] ring-4 ring-bg" />
                                <div className="bg-bg border border-black/5 dark:border-white/5 rounded-lg p-3 w-full shadow-sm text-sm">
                                    <div className="font-semibold text-text flex items-center gap-2 mb-1">
                                        <Play className="w-3.5 h-3.5 text-primary" /> Input
                                    </div>
                                    <p className="text-text-muted text-xs truncate">"{trace.userMessage}"</p>
                                </div>
                            </div>

                            {/* Trace Steps */}
                            {trace.traces && trace.traces.map((step, idx) => {
                                const isSelected = idx === activeStepIdx;
                                const actionType = step.action || 'Unknown';
                                const isGuardrail = actionType.includes('Guardrail');
                                const isTool = actionType.includes('Tool');
                                const isResult = actionType.includes('Result');
                                const hasError = actionType.includes('Fail') || actionType.includes('Block');
                                
                                const icon = ACTION_ICONS[actionType] || 
                                    Object.entries(ACTION_ICONS).find(([key, _]) => actionType.includes(key))?.[1] || 
                                    <Box className="w-3.5 h-3.5" />;

                                return (
                                    <div 
                                        key={idx} 
                                        className="relative group cursor-pointer"
                                        onClick={() => setActiveStepIdx(idx)}
                                    >
                                        <div className={`absolute -left-[35px] mt-[4px] p-1 rounded bg-card border ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-black/10 dark:border-white/10 ring-4 ring-bg'} z-10 transition-all`}>
                                            {icon}
                                        </div>

                                        <div className={`rounded-lg p-3 w-full transition-all border ${isSelected ? 'border-primary/50 bg-primary/[0.02] shadow-sm' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={`text-[13px] font-semibold truncate ${isSelected ? 'text-primary' : 'text-text'}`}>
                                                    {isTool && !isResult ? 'Call: ' : ''}
                                                    {actionType.replace('⚙️ Tool: ', '').replace('📦 Result: ', '').replace('🛡️ ', '').replace('🚨 ', '')}
                                                </span>
                                                {hasError && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono uppercase">
                                                <span>{step.agent}</span>
                                                <span>•</span>
                                                <span className={isGuardrail ? 'text-amber-500' : isTool ? 'text-blue-500' : 'text-purple-500'}>
                                                    {isGuardrail ? 'EVAL' : isTool ? (isResult ? 'OUTPUT' : 'EXECUTE') : 'GENERATION'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Output Node */}
                            {trace.agentResponse && (
                                <div className="relative">
                                    <div className="absolute -left-[30px] w-[6px] h-[6px] rounded-full bg-black/20 dark:bg-white/20 mt-[8px] ring-4 ring-bg" />
                                    <div className="bg-bg border border-black/5 dark:border-white/5 rounded-lg p-3 w-full shadow-sm text-sm">
                                        <div className="font-semibold text-text flex items-center gap-2 mb-1">
                                            <CheckCircle2Icon status={trace.status} /> Output
                                        </div>
                                        <p className="text-text-muted text-xs truncate">{trace.agentResponse}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* RIGHT: Inspector View */}
                <div className="flex-1 flex flex-col bg-bg">
                    {/* Inspector Header */}
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-card w-full shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileJson className="w-5 h-5 text-text-muted" />
                            <h2 className="text-base font-semibold text-text">Inspector</h2>
                        </div>
                        <div className="text-xs font-mono bg-bg px-2 py-1 rounded text-text-muted border border-black/5 dark:border-white/5">
                            Step {activeStepIdx + 1} of {trace.traces?.length || 0}
                        </div>
                    </div>

                    {/* Active Step Details */}
                    {activeStep ? (
                        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
                            
                            {/* Metadata Row */}
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-card px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm min-w-[150px] flex-1">
                                    <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold block mb-1">Agent / Parent</span>
                                    <span className="text-sm font-semibold text-text">{activeStep.agent}</span>
                                </div>
                                <div className="bg-card px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm min-w-[150px] flex-1">
                                    <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold block mb-1">Action Type</span>
                                    <span className="text-sm font-semibold text-text flex items-center gap-2">
                                        {activeStep.action}
                                    </span>
                                </div>
                                <div className="bg-card px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm min-w-[150px] flex-1">
                                    <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold block mb-1">Step Latency</span>
                                    <span className="text-sm font-semibold text-text flex items-center gap-2">
                                        {trace.durationMs ? `~${Math.round(trace.durationMs / (trace.traces?.length || 1))}ms (Est)` : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Reasoning Highlight View */}
                            {activeStep.action?.includes('Reasoning') && (
                                <div className="flex flex-col bg-purple-500/5 rounded-xl border border-purple-500/20 shadow-sm overflow-hidden mb-4">
                                    <div className="px-4 py-2 border-b border-purple-500/20 bg-purple-500/10 flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Agent Decision & Reason</span>
                                    </div>
                                    <div className="p-4 bg-bg/50 font-sans text-sm text-text whitespace-pre-wrap leading-relaxed">
                                        {activeStep.data?.text || (typeof activeStep.data === 'string' ? activeStep.data : JSON.stringify(activeStep.data, null, 2)) || "No explicit reasoning logged."}
                                    </div>
                                </div>
                            )}

                            {/* Payload Data View */}
                            {(!activeStep.action?.includes('Reasoning')) && (
                                <div className="flex flex-col bg-card rounded-xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                                    <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Code className="w-4 h-4 text-text-muted" />
                                            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                {activeStep.action?.includes('Tool') ? 'Input Arguments' : activeStep.action?.includes('Result') ? 'Output Response' : 'Payload'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-bg font-mono text-sm text-text whitespace-pre-wrap overflow-x-auto leading-relaxed custom-scrollbar max-h-[500px] overflow-y-auto">
                                        {formatDataLong(activeStep.data)}
                                    </div>
                                </div>
                            )}
                            
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-text-muted">
                            Select a step in the graph to inspect its payload.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const formatDataLong = (data) => {
    if (!data) return "No payload data available.";
    
    // If it's explicitly parsed reasoning or text block
    if (data.parsed_reasoning || data.text) {
        return data.text || (typeof data === 'string' ? data : JSON.stringify(data, null, 4));
    }
    
    // If there is an explicit input block (from tool calls)
    if (data.input) {
         try {
            const parsed = typeof data.input === 'string' ? JSON.parse(data.input) : data.input;
            return JSON.stringify({ input: parsed }, null, 4);
        } catch {
            return JSON.stringify({ input: data.input }, null, 4);
        }
    }
    
    // Try to parse stringified JSON first
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return JSON.stringify(parsed, null, 4);
        } catch {
            return data;
        }
    }
    return JSON.stringify(data, null, 4);
};

const CheckCircle2Icon = ({ status }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14" height="14"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={status === 'success' ? 'text-emerald-500' : 'text-amber-500'}
    >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);

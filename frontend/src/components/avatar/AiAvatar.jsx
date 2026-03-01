import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { useAudioAmplitude } from '../../hooks/useAudioAmplitude';

const STATUS_CONFIG = {
    [AI_STATUS.READY]:      { label: 'AI Ready',      color: 'bg-emerald-500' },
    [AI_STATUS.LISTENING]:  { label: 'Listening...',  color: 'bg-blue-500'    },
    [AI_STATUS.PROCESSING]: { label: 'Processing...', color: 'bg-purple-500'  },
    [AI_STATUS.SPEAKING]:   { label: 'Speaking...',   color: 'bg-indigo-500'  },
};

const MOUTH_IDS = ['mouth-neutral', 'mouth-open', 'mouth-smile', 'mouth-o', 'mouth-wide', 'mouth-closed'];

// Pupil resting positions  (viewBox 0 0 240 320)
const PD = { lx: 92, ly: 112, rx: 148, ry: 112 };

const AiAvatar = ({ compact = false }) => {
    const { aiStatus, currentAudioElement, liveTranscript, activeSubtitle } = useAppStore();
    const config    = STATUS_CONFIG[aiStatus];
    const isSpeaking   = aiStatus === AI_STATUS.SPEAKING;
    const isListening  = aiStatus === AI_STATUS.LISTENING;
    const isProcessing = aiStatus === AI_STATUS.PROCESSING;
    const isReady      = aiStatus === AI_STATUS.READY;

    const rawAmplitude = useAudioAmplitude(currentAudioElement);
    const amplitude    = rawAmplitude > 0.02 ? Math.min((rawAmplitude - 0.02) / 0.98, 1) : 0;

    const [displayedSubtitle, setDisplayedSubtitle] = useState('');
    const subtitleTimerRef = useRef(null);
    const svgRef           = useRef(null);

    /* ── subtitle ── */
    useEffect(() => {
        clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = setTimeout(() => {
            setDisplayedSubtitle(activeSubtitle && isSpeaking ? activeSubtitle : '');
        }, 0);
        return () => clearTimeout(subtitleTimerRef.current);
    }, [activeSubtitle, isSpeaking]);

    /* ── mouth ── */
    useEffect(() => {
        if (!svgRef.current) return;
        const show = (id) => MOUTH_IDS.forEach(mid => {
            const el = svgRef.current.getElementById(mid);
            if (el) el.setAttribute('visibility', mid === id ? 'visible' : 'hidden');
        });
        if (isProcessing)        show('mouth-closed');
        else if (isReady)        show('mouth-smile');
        else if (isListening)    show('mouth-neutral');
        else if (isSpeaking) {
            if      (amplitude > 0.65) show('mouth-wide');
            else if (amplitude > 0.40) show('mouth-open');
            else if (amplitude > 0.20) show('mouth-o');
            else                       show('mouth-neutral');
        } else show('mouth-neutral');
    }, [aiStatus, amplitude, isSpeaking, isProcessing, isReady, isListening]);

    /* ── pupils ── */
    useEffect(() => {
        if (!svgRef.current) return;
        const lp = svgRef.current.getElementById('leftPupil');
        const rp = svgRef.current.getElementById('rightPupil');
        if (!lp || !rp) return;
        if (isListening) {
            lp.setAttribute('cy', String(PD.ly - 4)); rp.setAttribute('cy', String(PD.ry - 4));
            lp.setAttribute('cx', String(PD.lx));     rp.setAttribute('cx', String(PD.rx));
        } else if (isProcessing) {
            lp.setAttribute('cx', String(PD.lx + 4)); rp.setAttribute('cx', String(PD.rx + 4));
            lp.setAttribute('cy', String(PD.ly + 2)); rp.setAttribute('cy', String(PD.ry + 2));
        } else {
            lp.setAttribute('cx', String(PD.lx)); lp.setAttribute('cy', String(PD.ly));
            rp.setAttribute('cx', String(PD.rx)); rp.setAttribute('cy', String(PD.ry));
        }
    }, [aiStatus, isListening, isProcessing]);

    const svgW = compact ? 80 : 200;
    const svgH = compact ? 100 : 250;

    return (
        <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col items-center gap-3 mx-auto'} ${compact ? 'w-full' : 'w-fit'}`}>

            {/* Avatar SVG + ripple wrapper */}
            <motion.div
                className="relative shrink-0"
                animate={{ scale: isSpeaking ? 1 + amplitude * 0.03 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <AnimatePresence>
                    {isListening && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1.45, opacity: 0.4 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                        />
                    )}
                </AnimatePresence>

                {/* ── SVG ── viewBox 0 0 240 320 ── */}
                <svg
                    ref={svgRef}
                    viewBox="0 0 240 320"
                    xmlns="http://www.w3.org/2000/svg"
                    width={svgW}
                    height={svgH}
                >
                    {/* ─── BODY ─── */}
                    <g id="bodyGroup">
                        {/* White coat base */}
                        <path
                            d="M26,248 Q16,320 16,320 H224 Q224,320 214,248
                               Q188,270 162,260 L138,216 L120,226 L102,216 L78,260
                               Q52,270 26,248 Z"
                            fill="#EFF4F8"
                        />
                        {/* Coat depth — left */}
                        <path d="M26,248 Q52,270 78,260 Q62,300 46,320 H26 Z"
                            fill="#D0DCE6" opacity="0.9" />
                        {/* Coat depth — right */}
                        <path d="M214,248 Q188,270 162,260 Q178,300 194,320 H214 Z"
                            fill="#D0DCE6" opacity="0.9" />
                        {/* Scrubs shirt */}
                        <path
                            d="M78,260 L102,216 L120,226 L138,216 L162,260
                               Q146,286 120,289 Q94,286 78,260 Z"
                            fill="#0EA5E9"
                        />
                        {/* Scrubs collar */}
                        <path d="M102,216 Q120,213 138,216 Q130,223 120,226 Q110,223 102,216 Z"
                            fill="#0284C7" />
                        {/* Coat lapel left */}
                        <path d="M78,260 L102,216 L120,226 L94,274 Z"
                            fill="white" stroke="#B8C8D4" strokeWidth="0.8" />
                        {/* Coat lapel right */}
                        <path d="M162,260 L138,216 L120,226 L146,274 Z"
                            fill="white" stroke="#B8C8D4" strokeWidth="0.8" />
                        {/* Center seam */}
                        <line x1="120" y1="228" x2="120" y2="320"
                            stroke="#C0CDD6" strokeWidth="0.7" strokeDasharray="5,5" />
                        {/* Breast pocket */}
                        <rect x="162" y="272" width="28" height="22" rx="3"
                            fill="none" stroke="#B0BEC5" strokeWidth="1" />
                        {/* Pen in pocket */}
                        <line x1="170" y1="272" x2="170" y2="294"
                            stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                        <line x1="176" y1="272" x2="176" y2="294"
                            stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                        {/* Stethoscope */}
                        <path d="M92,274 Q86,294 93,306 Q100,314 110,310 Q119,307 117,298"
                            stroke="#607D8B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        <circle cx="90" cy="272" r="7"
                            fill="none" stroke="#607D8B" strokeWidth="3" />
                        <circle cx="90" cy="272" r="3" fill="#607D8B" opacity="0.5" />
                    </g>

                    {/* ─── HEAD ─── */}
                    <g id="headGroup">
                        {/* Neck */}
                        <rect x="105" y="190" width="30" height="30" rx="9" fill="#F5BF96" />

                        {/* Ears */}
                        <ellipse cx="41"  cy="122" rx="13" ry="19" fill="#F5BF96" />
                        <ellipse cx="199" cy="122" rx="13" ry="19" fill="#F5BF96" />
                        <ellipse cx="41"  cy="122" rx="7"  ry="11" fill="#D8956A" />
                        <ellipse cx="199" cy="122" rx="7"  ry="11" fill="#D8956A" />

                        {/* Head base */}
                        <ellipse cx="120" cy="120" rx="80" ry="88" fill="#F5BF96" />

                        {/* Hair */}
                        <path
                            d="M40,116 Q40,36 120,34 Q200,36 200,116
                               Q192,56 158,42 Q140,34 120,34
                               Q100,34 82,42 Q48,56 40,116 Z"
                            fill="#1A0700"
                        />
                        {/* Hair side volume left */}
                        <path d="M40,116 Q34,92 38,70 Q44,50 60,42"
                            stroke="#1A0700" strokeWidth="12" fill="none" strokeLinecap="round" />
                        {/* Hair side volume right */}
                        <path d="M200,116 Q206,92 202,70 Q196,50 180,42"
                            stroke="#1A0700" strokeWidth="12" fill="none" strokeLinecap="round" />

                        {/* Face ambient shading */}
                        <ellipse cx="120" cy="130" rx="55" ry="62" fill="#E8A070" opacity="0.15" />
                        <ellipse cx="66"  cy="134" rx="24" ry="34" fill="#E09060" opacity="0.20" />
                        <ellipse cx="174" cy="134" rx="24" ry="34" fill="#E09060" opacity="0.20" />

                        {/* Eyebrows */}
                        <path d="M68,97 Q90,87 111,95"
                            stroke="#1A0700" strokeWidth="4.2" fill="none" strokeLinecap="round" />
                        <path d="M129,95 Q150,87 172,97"
                            stroke="#1A0700" strokeWidth="4.2" fill="none" strokeLinecap="round" />

                        {/* ── Left Eye Group ── */}
                        <g id="leftEyeGroup">
                            <ellipse cx="92" cy="112" rx="24" ry="21" fill="white" />
                            <circle  cx="92" cy="112" r="15" fill="#3B82F6" />
                            {/* Iris depth ring */}
                            <circle  cx="92" cy="112" r="15" fill="none" stroke="#1D4ED8" strokeWidth="2" opacity="0.5" />
                            {/* Pupil — moved by ref */}
                            <circle  id="leftPupil" cx="92" cy="112" r="9" fill="#06060F" />
                            {/* Specular highlights */}
                            <circle  cx="99" cy="105" r="5"   fill="white" opacity="0.88" />
                            <circle  cx="86" cy="118" r="2.2" fill="white" opacity="0.50" />
                            {/* Top lid */}
                            <path d="M68,108 Q92,96 116,108"
                                stroke="#1A0700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            {/* Lower lash line */}
                            <path d="M71,118 Q92,125 113,118"
                                stroke="#1A0700" strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.4" />
                        </g>

                        {/* ── Right Eye Group ── */}
                        <g id="rightEyeGroup">
                            <ellipse cx="148" cy="112" rx="24" ry="21" fill="white" />
                            <circle  cx="148" cy="112" r="15" fill="#3B82F6" />
                            <circle  cx="148" cy="112" r="15" fill="none" stroke="#1D4ED8" strokeWidth="2" opacity="0.5" />
                            {/* Pupil — moved by ref */}
                            <circle  id="rightPupil" cx="148" cy="112" r="9" fill="#06060F" />
                            <circle  cx="155" cy="105" r="5"   fill="white" opacity="0.88" />
                            <circle  cx="142" cy="118" r="2.2" fill="white" opacity="0.50" />
                            <path d="M124,108 Q148,96 172,108"
                                stroke="#1A0700" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <path d="M127,118 Q148,125 169,118"
                                stroke="#1A0700" strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.4" />
                        </g>

                        {/* Nose */}
                        <path d="M117,130 Q114,148 120,153 Q126,148 123,130"
                            stroke="#C07848" strokeWidth="1.9" fill="none" strokeLinecap="round" />
                        <ellipse cx="113" cy="152" rx="6.5" ry="3.5" fill="#C07848" fillOpacity="0.28" />
                        <ellipse cx="127" cy="152" rx="6.5" ry="3.5" fill="#C07848" fillOpacity="0.28" />

                        {/* ── Mouth Group ── */}
                        <g id="mouthGroup">

                            {/* mouth-neutral  ← default visible */}
                            <path
                                id="mouth-neutral"
                                d="M101,168 Q120,174 139,168"
                                stroke="#8B3E10" strokeWidth="2.8" fill="none" strokeLinecap="round"
                            />

                            {/* mouth-open */}
                            <g id="mouth-open" visibility="hidden">
                                <path d="M101,165 Q120,184 139,165 Q120,176 101,165 Z" fill="#7A1010" />
                                <path d="M107,165 Q120,173 133,165"
                                    stroke="white" strokeWidth="7.5" fill="none" strokeLinecap="round" />
                            </g>

                            {/* mouth-smile */}
                            <path
                                id="mouth-smile"
                                d="M96,165 Q120,186 144,165"
                                stroke="#8B3E10" strokeWidth="2.8" fill="none" strokeLinecap="round"
                                visibility="hidden"
                            />

                            {/* mouth-o */}
                            <ellipse
                                id="mouth-o"
                                cx="120" cy="170" rx="13" ry="17"
                                fill="#7A1010" stroke="#8B3E10" strokeWidth="1.8"
                                visibility="hidden"
                            />

                            {/* mouth-wide */}
                            <g id="mouth-wide" visibility="hidden">
                                <path d="M88,164 Q120,188 152,164 Q120,179 88,164 Z" fill="#7A1010" />
                                <path d="M94,164 Q120,178 146,164"
                                    stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" />
                            </g>

                            {/* mouth-closed */}
                            <path
                                id="mouth-closed"
                                d="M107,168 Q120,170 133,168"
                                stroke="#8B3E10" strokeWidth="2.2" fill="none" strokeLinecap="round"
                                visibility="hidden"
                            />

                        </g>

                        {/* Cheek blush */}
                        <ellipse cx="62"  cy="140" rx="20" ry="12" fill="#FF9090" fillOpacity="0.16" />
                        <ellipse cx="178" cy="140" rx="20" ry="12" fill="#FF9090" fillOpacity="0.16" />

                        {/* Nasolabial folds — subtle */}
                        <path d="M83,154 Q78,168 82,176"
                            stroke="#C07848" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.32" />
                        <path d="M157,154 Q162,168 158,176"
                            stroke="#C07848" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.32" />

                    </g>
                </svg>
            </motion.div>

            {/* ── Status + info ── */}
            <div className={`flex flex-col ${compact ? 'items-start gap-0.5' : 'items-center gap-1.5 w-full'}`}>

                {/* Name — full mode only */}
                {!compact && (
                    <p className="text-base font-bold text-text tracking-wide">MedAI Pharmacist</p>
                )}

                {/* Status badge */}
                <div className={`flex items-center gap-2 rounded-full border border-white/10 backdrop-blur-md transition-all duration-500
                    ${compact ? 'py-1 px-2.5' : 'py-1.5 px-4 bg-card/80 shadow-sm'}`}>
                    <span className={`rounded-full shrink-0 transition-colors duration-500 ${config.color}
                        ${isSpeaking || isListening ? 'animate-pulse' : ''}
                        ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
                    />
                    <span className={`font-semibold text-text ${compact ? 'text-[11px]' : 'text-sm'}`}>
                        {config.label}
                    </span>
                    {!compact && (
                        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
                            Auto-pilot
                        </span>
                    )}
                </div>

                {/* Live transcript — full mode only */}
                {!compact && (
                    <AnimatePresence>
                        {isListening && liveTranscript && !displayedSubtitle && (
                            <motion.div
                                key="transcript"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-1 bg-black/40 backdrop-blur-md text-white/80 px-3 py-2 rounded-xl text-xs italic text-center border border-white/5 max-w-55"
                            >
                                {liveTranscript}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default AiAvatar;

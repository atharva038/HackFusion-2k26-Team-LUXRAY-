import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { useAudioAmplitude } from '../../hooks/useAudioAmplitude';

// ─── Status chip config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    [AI_STATUS.READY]:      { label: 'AI Ready',    dot: 'bg-green-400' },
    [AI_STATUS.LISTENING]:  { label: 'Listening…',  dot: 'bg-blue-400 animate-pulse' },
    [AI_STATUS.PROCESSING]: { label: 'Processing…', dot: 'bg-purple-400 animate-bounce' },
    [AI_STATUS.SPEAKING]:   { label: 'Speaking…',   dot: 'bg-teal-400 animate-pulse' },
};

// ─── SVG DEFS ─────────────────────────────────────────────────────────────────
const SvgDefs = () => (
    <defs>

        {/* ═══ SKIN ══════════════════════════════════════════════════════ */}
        <radialGradient id="av-skin" cx="42%" cy="26%" r="75%">
            <stop offset="0%"   stopColor="#FDF5EE" />
            <stop offset="28%"  stopColor="#F0D8C4" />
            <stop offset="62%"  stopColor="#DDB898" />
            <stop offset="100%" stopColor="#C6987A" />
        </radialGradient>

        {/* 3-point lighting – left fill shadow */}
        <linearGradient id="av-shadow-l" x1="0" y1="0.5" x2="0.4" y2="0.5">
            <stop offset="0%"   stopColor="#7A3818" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7A3818" stopOpacity="0"    />
        </linearGradient>
        {/* 3-point lighting – right rim shadow */}
        <linearGradient id="av-shadow-r" x1="1" y1="0.5" x2="0.6" y2="0.5">
            <stop offset="0%"   stopColor="#5A3020" stopOpacity="0.17" />
            <stop offset="100%" stopColor="#5A3020" stopOpacity="0"    />
        </linearGradient>
        {/* Under-chin ambient occlusion */}
        <linearGradient id="av-shadow-b" x1="0.5" y1="1" x2="0.5" y2="0.72">
            <stop offset="0%"   stopColor="#4A2808" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#4A2808" stopOpacity="0"    />
        </linearGradient>

        {/* ═══ SKIN TEXTURE ═══════════════════════════════════════════════
            fractalNoise overlay at very low opacity simulates pore/skin grain
        ════════════════════════════════════════════════════════════════ */}
        <filter id="av-skin-texture" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72 0.68"
                numOctaves="4" seed="8" result="noise" />
            <feColorMatrix type="matrix"
                values="0 0 0 0 0.92
                        0 0 0 0 0.78
                        0 0 0 0 0.65
                        0 0 0 0.048 0"
                in="noise" result="tintedNoise" />
            <feComposite in="tintedNoise" in2="SourceGraphic" operator="in" />
        </filter>

        {/* ═══ HAIR ═══════════════════════════════════════════════════════ */}
        <linearGradient id="av-hair" x1="0.12" y1="0" x2="0.44" y2="1">
            <stop offset="0%"   stopColor="#0C0604" />
            <stop offset="45%"  stopColor="#180C06" />
            <stop offset="100%" stopColor="#261408" />
        </linearGradient>
        <linearGradient id="av-hair-side" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%"   stopColor="#160A04" />
            <stop offset="100%" stopColor="#241206" />
        </linearGradient>

        {/* ═══ CLOTHING ═══════════════════════════════════════════════════ */}
        <linearGradient id="av-cloth" x1="0.12" y1="0" x2="0.88" y2="1">
            <stop offset="0%"   stopColor="#1D3A6C" />
            <stop offset="100%" stopColor="#0C1E42" />
        </linearGradient>
        <linearGradient id="av-coat" x1="0" y1="0" x2="0.1" y2="1">
            <stop offset="0%"   stopColor="#EBF1FA" />
            <stop offset="100%" stopColor="#D4DEEE" />
        </linearGradient>

        {/* ═══ NECK ═══════════════════════════════════════════════════════ */}
        <linearGradient id="av-neck" x1="0.22" y1="0" x2="0.78" y2="1">
            <stop offset="0%"   stopColor="#EDD0B8" />
            <stop offset="100%" stopColor="#CCAA88" />
        </linearGradient>

        {/* ═══ LIPS — slightly fuller ══════════════════════════════════════ */}
        <linearGradient id="av-lip-upper" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#D9A490" />
            <stop offset="55%"  stopColor="#C88878" />
            <stop offset="100%" stopColor="#B87060" />
        </linearGradient>
        <linearGradient id="av-lip-lower" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#D29488" />
            <stop offset="42%"  stopColor="#C28272" />
            <stop offset="100%" stopColor="#AC6858" />
        </linearGradient>

        {/* ═══ IRIS ═══════════════════════════════════════════════════════ */}
        <radialGradient id="av-iris" cx="36%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#6298F0" />
            <stop offset="22%"  stopColor="#2A58D4" />
            <stop offset="58%"  stopColor="#1438A0" />
            <stop offset="100%" stopColor="#092070" />
        </radialGradient>

        {/* ═══ AURA ═══════════════════════════════════════════════════════ */}
        <radialGradient id="av-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0.07" />
            <stop offset="55%"  stopColor="#2563EB" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0"    />
        </radialGradient>

        {/* ═══ EYE CLIP PATHS — almond with slight cat-eye tilt ═══════════ */}
        <clipPath id="av-clip-leye">
            <path d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z" />
        </clipPath>
        <clipPath id="av-clip-reye">
            <path d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z" />
        </clipPath>

        {/* ═══ FILTERS ════════════════════════════════════════════════════ */}
        <filter id="av-eye-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <filter id="av-face-shadow" x="-12%" y="-6%" width="124%" height="118%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#00000015" />
        </filter>
        <filter id="av-gloss" x="-25%" y="-50%" width="150%" height="200%">
            <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <filter id="av-soft" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="4.5" />
        </filter>
    </defs>
);

// ─── SINGLE EYE  (no tear duct) ───────────────────────────────────────────────
const Eye = ({ eyeBlinkScale, eyeGlowOpacity, clipId }) => (
    <g transform={`scale(1, ${eyeBlinkScale})`}>

        {/* Eye white */}
        <path
            d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z"
            fill="#F6F0EA"
            clipPath={`url(#${clipId})`}
        />

        {/* Upper-lid shadow on the white */}
        <path
            d="M -29,3 C -22,-13 -2,-17 28,-3 C 14,-5 -4,-7 -29,-2 Z"
            fill="#C89878"
            opacity="0.10"
            clipPath={`url(#${clipId})`}
        />

        {/* Iris */}
        <ellipse cx="0" cy="-1" rx="12.5" ry="12.5"
            fill="url(#av-iris)" clipPath={`url(#${clipId})`} />

        {/* Iris radial texture spokes */}
        {Array.from({ length: 6 }, (_, i) => {
            const a = (i * 30) * Math.PI / 180;
            return (
                <line key={i}
                    x1={Math.cos(a) * 5.5}   y1={Math.sin(a) * 5.5 - 1}
                    x2={Math.cos(a) * 12}     y2={Math.sin(a) * 12 - 1}
                    stroke="#071060" strokeWidth="0.55" opacity="0.22"
                    clipPath={`url(#${clipId})`}
                />
            );
        })}

        {/* Limbal ring */}
        <ellipse cx="0" cy="-1" rx="12.5" ry="12.5"
            fill="none" stroke="#060C48" strokeWidth="1.7" opacity="0.60"
            clipPath={`url(#${clipId})`} />

        {/* Pupil */}
        <ellipse cx="0.5" cy="0" rx="6.4" ry="6.4"
            fill="#03070C" clipPath={`url(#${clipId})`} />
        <ellipse cx="-1.5" cy="-1" rx="2.2" ry="1.8"
            fill="#081830" opacity="0.45" clipPath={`url(#${clipId})`} />

        {/* State-reactive tint */}
        <ellipse cx="0" cy="-1" rx="12.5" ry="12.5"
            fill="#3B82F6" opacity={eyeGlowOpacity * 0.22}
            clipPath={`url(#${clipId})`} />

        {/* Primary catchlight */}
        <ellipse cx="-4" cy="-5" rx="4.2" ry="3.6"
            fill="white" opacity="0.92" clipPath={`url(#${clipId})`} />
        {/* Secondary micro catchlight */}
        <ellipse cx="5.5" cy="3.5" rx="2" ry="1.6"
            fill="white" opacity="0.42" clipPath={`url(#${clipId})`} />

        {/* Upper eyelid skin */}
        <path d="M -29,3 C -22,-13 -2,-17 28,-3"
            fill="#DDB898" opacity="0.42" clipPath={`url(#${clipId})`} />

        {/* Upper lash line */}
        <path d="M -29,2 C -20,-14 -2,-17 28,-4"
            stroke="#0E0804" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        {/* Outer corner lash flick */}
        <path d="M 22,-6 C 26,-10 31,-9 33,-5"
            stroke="#0E0804" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Lower lash line */}
        <path d="M -29,3 C -12,12 14,10 28,-3"
            fill="none" stroke="#C0A080" strokeWidth="0.9" opacity="0.32" />

        {/* No tear duct / inner corner element — clean eye corner */}

    </g>
);

// ─── AVATAR FACE SVG ──────────────────────────────────────────────────────────
const AvatarFace = ({ mouthGap, eyeBlinkScale, eyeGlowOpacity }) => (
    <svg
        viewBox="0 0 400 500"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        aria-hidden="true"
    >
        <SvgDefs />

        {/* Soft ambient aura */}
        <ellipse cx="200" cy="255" rx="185" ry="210" fill="url(#av-aura)" />

        {/* ═══════════════════════════════════════════════════════════════
            CLOTHING
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="M 0 500 Q 20 416 78 382 L 132 360 L 200 376 L 268 360 L 322 382 Q 380 416 400 500 Z"
            fill="url(#av-cloth)"
        />
        <path
            d="M 126 362 Q 162 388 200 380 Q 238 388 274 362 L 260 349 Q 236 374 200 368 Q 164 374 140 349 Z"
            fill="url(#av-coat)"
        />
        <path d="M 138 352 Q 168 376 200 368"
            fill="none" stroke="#C0CCDF" strokeWidth="1.1" opacity="0.55" />
        <path d="M 262 352 Q 232 376 200 368"
            fill="none" stroke="#C0CCDF" strokeWidth="1.1" opacity="0.55" />
        <line x1="200" y1="380" x2="200" y2="402"
            stroke="#B2C4E0" strokeWidth="1.2" opacity="0.45" />

        {/* ═══════════════════════════════════════════════════════════════
            NECK
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="M 183 348 Q 181 366 184 382 L 216 382 Q 219 366 217 348 Z"
            fill="url(#av-neck)"
        />
        <path d="M 185 350 Q 186 368 185 381"
            fill="none" stroke="#C0A888" strokeWidth="1.4" opacity="0.24" />
        <path d="M 215 350 Q 214 368 215 381"
            fill="none" stroke="#C0A888" strokeWidth="1.4" opacity="0.24" />
        <ellipse cx="200" cy="383" rx="20" ry="3.5"
            fill="#B89878" opacity="0.16" />

        {/* ═══════════════════════════════════════════════════════════════
            HEAD SHAPE  — ROUND face
            Wider at cheekbones (x 70→330 = 260 px)
            Shorter oval chin → soft round jaw
            Width/visible-height ratio ≈ 0.90  (round!)
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="
                M 200,56
                C 296,50  330,138  330,202
                C 330,278  306,334  248,358
                C 230,369  215,375  200,377
                C 185,375  170,369  152,358
                C  94,334   70,278   70,202
                C  70,138  104,50   200,56 Z
            "
            fill="url(#av-skin)"
            filter="url(#av-face-shadow)"
        />

        {/* Skin micro-texture overlay — same path, fractalNoise filter */}
        <path
            d="
                M 200,56
                C 296,50  330,138  330,202
                C 330,278  306,334  248,358
                C 230,369  215,375  200,377
                C 185,375  170,369  152,358
                C  94,334   70,278   70,202
                C  70,138  104,50   200,56 Z
            "
            fill="white"
            opacity="1"
            filter="url(#av-skin-texture)"
        />

        {/* ─── 3-point lighting shadows ──────────────────────────────── */}
        <path
            d="M 200,56 C 104,50 70,138 70,202 C 70,278 94,334 152,358
               C 170,369 185,375 200,377 L 200,56 Z"
            fill="url(#av-shadow-l)"
        />
        <path
            d="M 200,56 C 296,50 330,138 330,202 C 330,278 306,334 248,358
               C 230,369 215,375 200,377 L 200,56 Z"
            fill="url(#av-shadow-r)"
        />
        <path
            d="M 154,360 C 176,376 224,376 246,360
               Q 222,380 200,380 Q 178,380 154,360 Z"
            fill="url(#av-shadow-b)"
        />

        {/* ═══════════════════════════════════════════════════════════════
            EARS  — adjusted to match wider face (x≈70/330)
        ════════════════════════════════════════════════════════════════ */}
        <path d="M 70,202 Q 62,222 66,240 Q 72,252 79,245
                 Q 82,232 77,218 Q 74,209 70,202 Z"
            fill="#DCBA9E" />
        <path d="M 330,202 Q 338,222 334,240 Q 328,252 321,245
                 Q 318,232 323,218 Q 326,209 330,202 Z"
            fill="#DCBA9E" />
        <path d="M 68,210 Q 65,226 68,242"
            fill="none" stroke="#C0A082" strokeWidth="1.1" opacity="0.28" />
        <path d="M 332,210 Q 335,226 332,242"
            fill="none" stroke="#C0A082" strokeWidth="1.1" opacity="0.28" />

        {/* ═══════════════════════════════════════════════════════════════
            HAIR  — widened to match round head
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="
                M 70,202
                Q 60,120   90,76
                Q 126,26   200,18
                Q 274,26   310,76
                Q 340,120  330,202
                Q 318,148  288,116
                Q 252,80   200,78
                Q 148,80   112,116
                Q  82,148   70,202 Z
            "
            fill="url(#av-hair)"
        />
        {/* Left temple flow */}
        <path
            d="M 68,204 Q 58,266 62,318 Q 72,284 76,254 Q 74,228 70,204 Z"
            fill="url(#av-hair-side)"
        />
        {/* Right temple flow */}
        <path
            d="M 332,204 Q 342,266 338,318 Q 328,284 324,254 Q 326,228 330,204 Z"
            fill="url(#av-hair-side)"
        />
        {/* Crown shine streaks */}
        <path d="M 152,70 Q 182,46 222,52"
            stroke="#3A2010" strokeWidth="6" fill="none"
            strokeLinecap="round" opacity="0.28" />
        <path d="M 170,58 Q 198,42 228,48"
            stroke="#4A2C18" strokeWidth="3.2" fill="none"
            strokeLinecap="round" opacity="0.18" />
        {/* Hairline edge softener */}
        <path
            d="M 112,116 Q 124,104 140,96 Q 160,88 182,84
               Q 200,82 218,84 Q 240,88 260,96
               Q 276,104 288,116"
            fill="none"
            stroke="url(#av-hair)"
            strokeWidth="5.5"
            opacity="0.55"
        />

        {/* ═══════════════════════════════════════════════════════════════
            EYE SOCKET DEPTH
        ════════════════════════════════════════════════════════════════ */}
        <ellipse cx="160" cy="192" rx="40" ry="24"
            fill="#7A4020" opacity="0.065" filter="url(#av-soft)" />
        <ellipse cx="240" cy="192" rx="40" ry="24"
            fill="#7A4020" opacity="0.065" filter="url(#av-soft)" />

        {/* ═══════════════════════════════════════════════════════════════
            EYEBROWS
        ════════════════════════════════════════════════════════════════ */}
        <path d="M 128 168 Q 147 154 165 153 Q 178 152 188 158"
            stroke="#120A04" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 130 170 Q 148 157 165 156 Q 178 155 186 161"
            stroke="#2A1608" strokeWidth="1.8" fill="none"
            strokeLinecap="round" opacity="0.45" />
        <path d="M 212 158 Q 222 152 236 153 Q 254 154 272 168"
            stroke="#120A04" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 214 160 Q 222 155 236 156 Q 252 156 270 170"
            stroke="#2A1608" strokeWidth="1.8" fill="none"
            strokeLinecap="round" opacity="0.45" />
        <path d="M 132 170 Q 160 162 188 168"
            fill="none" stroke="#906040" strokeWidth="3" opacity="0.09" />
        <path d="M 212 168 Q 240 162 268 170"
            fill="none" stroke="#906040" strokeWidth="3" opacity="0.09" />

        {/* ═══════════════════════════════════════════════════════════════
            LEFT EYE  — centre (160, 190)
        ════════════════════════════════════════════════════════════════ */}
        <ellipse cx="160" cy="190" rx="22" ry="22"
            fill="#2563EB" opacity={eyeGlowOpacity * 0.11}
            filter="url(#av-eye-glow)" />
        <path d="M 132 177 C 146 168 174 167 190 175"
            fill="none" stroke="#9A7050" strokeWidth="2.8"
            opacity="0.14" strokeLinecap="round" />
        <path d="M 133 185 C 148 181 172 181 188 185"
            fill="none" stroke="#C8A080" strokeWidth="2"
            opacity="0.12" strokeLinecap="round" />
        <g transform="translate(160, 190)">
            <Eye eyeBlinkScale={eyeBlinkScale} eyeGlowOpacity={eyeGlowOpacity} clipId="av-clip-leye" />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT EYE  — centre (240, 190)
        ════════════════════════════════════════════════════════════════ */}
        <ellipse cx="240" cy="190" rx="22" ry="22"
            fill="#2563EB" opacity={eyeGlowOpacity * 0.11}
            filter="url(#av-eye-glow)" />
        <path d="M 210 175 C 226 167 254 168 268 177"
            fill="none" stroke="#9A7050" strokeWidth="2.8"
            opacity="0.14" strokeLinecap="round" />
        <path d="M 212 185 C 228 181 252 181 268 185"
            fill="none" stroke="#C8A080" strokeWidth="2"
            opacity="0.12" strokeLinecap="round" />
        <g transform="translate(240, 190)">
            <Eye eyeBlinkScale={eyeBlinkScale} eyeGlowOpacity={eyeGlowOpacity} clipId="av-clip-reye" />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            NOSE
        ════════════════════════════════════════════════════════════════ */}
        <path d="M 200 222 Q 198 246 198 260"
            fill="none" stroke="#FFEEDD" strokeWidth="3.5"
            strokeLinecap="round" opacity="0.45" />
        <path d="M 196 224 Q 190 246 192 264"
            fill="none" stroke="#C8A890" strokeWidth="1.1"
            strokeLinecap="round" opacity="0.32" />
        <path d="M 204 224 Q 210 246 208 264"
            fill="none" stroke="#C8A890" strokeWidth="1.1"
            strokeLinecap="round" opacity="0.32" />
        <ellipse cx="200" cy="265" rx="5.5" ry="4.2"
            fill="white" opacity="0.14" />
        <path d="M 190 265 C 185 270 186 274 192 272"
            fill="none" stroke="#B89878" strokeWidth="1.5"
            strokeLinecap="round" opacity="0.42" />
        <path d="M 210 265 C 215 270 214 274 208 272"
            fill="none" stroke="#B89878" strokeWidth="1.5"
            strokeLinecap="round" opacity="0.42" />
        <ellipse cx="192" cy="270" rx="3.8" ry="2.2" fill="#B09078" opacity="0.22" />
        <ellipse cx="208" cy="270" rx="3.8" ry="2.2" fill="#B09078" opacity="0.22" />

        {/* Philtrum */}
        <path d="M 196 280 L 196 290"
            fill="none" stroke="#C8A890" strokeWidth="1.1"
            strokeLinecap="round" opacity="0.22" />
        <path d="M 204 280 L 204 290"
            fill="none" stroke="#C8A890" strokeWidth="1.1"
            strokeLinecap="round" opacity="0.22" />

        {/* ═══════════════════════════════════════════════════════════════
            MOUTH  — fuller lips  (±26 wide, taller cupid's bow & lower lip)
            Lower lip translates by mouthGap for lip-sync.
        ════════════════════════════════════════════════════════════════ */}
        <g transform="translate(200, 294)">

            {/* Oral cavity */}
            {mouthGap > 0.8 && (
                <ellipse
                    cx="0"
                    cy={mouthGap * 0.42}
                    rx={Math.min(20, 12 + mouthGap * 0.40)}
                    ry={Math.max(0.5, mouthGap * 0.54)}
                    fill="#1A0808"
                />
            )}

            {/* Upper teeth */}
            {mouthGap > 7 && (
                <ellipse
                    cx="0"
                    cy={mouthGap * 0.13}
                    rx={Math.min(15, 10 + mouthGap * 0.28)}
                    ry={Math.min(4.5, mouthGap * 0.20)}
                    fill="#EDE8E2"
                    opacity="0.90"
                />
            )}

            {/* Lower lip — wider and fuller — animates downward */}
            <g style={{ transform: `translateY(${mouthGap}px)`, transition: 'transform 0.05s ease-out' }}>
                <path
                    d="M -26,0 C -15,12 15,12 26,0 C 16,-4.5 0,-3.8 -16,-4.5 Z"
                    fill="url(#av-lip-lower)"
                />
                <ellipse cx="0" cy="5" rx="10" ry="3.2"
                    fill="white" opacity="0.10" filter="url(#av-gloss)" />
            </g>

            {/* Upper lip — fuller cupid's bow */}
            <path
                d="
                    M -26,0
                    C -20,-4.5 -13,-9  -6,-8.5
                    C  -3,-10   0,-13   6,-8.5
                    C  13,-9   20,-4.5  26,0
                    C  16,5     6,4.5   0,4.5
                    C  -6,4.5 -16,5   -26,0 Z
                "
                fill="url(#av-lip-upper)"
            />
            <ellipse cx="-4" cy="-4.5" rx="6.5" ry="2.5"
                fill="white" opacity="0.13" filter="url(#av-gloss)" />

            {/* Lip seam */}
            {mouthGap < 1 && (
                <path
                    d="M -26,0 C -12,2.8 12,2.8 26,0"
                    fill="none" stroke="#A87060" strokeWidth="0.7" opacity="0.38"
                />
            )}

            {/* Corner smile curves */}
            <path d="M -26,0 C -28,2 -27,4 -24,2.5"
                fill="none" stroke="#B88070" strokeWidth="0.8" opacity="0.28" />
            <path d="M 26,0 C 28,2 27,4 24,2.5"
                fill="none" stroke="#B88070" strokeWidth="0.8" opacity="0.28" />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            SKIN HIGHLIGHTS
        ════════════════════════════════════════════════════════════════ */}

        {/* Forehead key light */}
        <ellipse cx="200" cy="128" rx="65" ry="36"
            fill="white" opacity="0.052" filter="url(#av-soft)" />

        {/* Nose bridge glow */}
        <ellipse cx="200" cy="238" rx="8" ry="24"
            fill="white" opacity="0.055" filter="url(#av-soft)" />

        {/* Cheekbone highlights — pulled wider for round face */}
        <ellipse cx="118" cy="232" rx="30" ry="13"
            fill="white" opacity="0.075" filter="url(#av-soft)" />
        <ellipse cx="282" cy="232" rx="30" ry="13"
            fill="white" opacity="0.075" filter="url(#av-soft)" />

        {/* Subtle warm blush */}
        <ellipse cx="118" cy="250" rx="24" ry="12"
            fill="#E89888" opacity="0.055" filter="url(#av-soft)" />
        <ellipse cx="282" cy="250" rx="24" ry="12"
            fill="#E89888" opacity="0.055" filter="url(#av-soft)" />

        {/* Under-lip shadow */}
        <ellipse cx="200" cy="316" rx="20" ry="6"
            fill="#B08870" opacity="0.11" />

        {/* Chin ambient occlusion */}
        <ellipse cx="200" cy="369" rx="34" ry="9"
            fill="#C8A090" opacity="0.09" />
    </svg>
);

// ─── MAIN AVATAR COMPONENT ────────────────────────────────────────────────────
const AiAvatar = () => {
    const {
        aiStatus,
        liveTranscript,
        activeSubtitle,
        currentAudioElement,
    } = useAppStore();

    const config       = STATUS_CONFIG[aiStatus];
    const isSpeaking   = aiStatus === AI_STATUS.SPEAKING;
    const isListening  = aiStatus === AI_STATUS.LISTENING;
    const isProcessing = aiStatus === AI_STATUS.PROCESSING;

    // ── Amplitude → lip-sync ─────────────────────────────────────────────
    const rawAmplitude = useAudioAmplitude(currentAudioElement);
    const amplitude = rawAmplitude > 0.06
        ? Math.min((rawAmplitude - 0.06) / 0.94, 1)
        : 0;
    const mouthGap = isSpeaking ? amplitude * 18 : 0;

    // ── Eye blink — random 2.4–6 s ───────────────────────────────────────
    const [eyeBlinkScale, setEyeBlinkScale] = useState(1);
    const blinkRef = useRef(null);
    useEffect(() => {
        const schedule = () => {
            blinkRef.current = setTimeout(() => {
                setEyeBlinkScale(0.06);
                setTimeout(() => { setEyeBlinkScale(1); schedule(); }, 120);
            }, 2400 + Math.random() * 3600);
        };
        schedule();
        return () => clearTimeout(blinkRef.current);
    }, []);

    // ── Eye glow ─────────────────────────────────────────────────────────
    const eyeGlowOpacity = isListening
        ? 0.85
        : isSpeaking
            ? 0.42 + amplitude * 0.58
            : isProcessing ? 0.38 : 0.20;

    // ── Subtitle — shown exactly when audio plays (delay handled in InputArea) ──
    const [displayedSubtitle, setDisplayedSubtitle] = useState('');
    const subtitleTimerRef = useRef(null);
    useEffect(() => {
        clearTimeout(subtitleTimerRef.current);
        if (activeSubtitle && isSpeaking) {
            setDisplayedSubtitle(activeSubtitle);
        } else {
            setDisplayedSubtitle('');
        }
        return () => clearTimeout(subtitleTimerRef.current);
    }, [activeSubtitle, isSpeaking]);

    // ── Speaking halo ────────────────────────────────────────────────────
    const speakingGlowPx    = isSpeaking ? 38 + amplitude * 38 : 0;
    const speakingGlowAlpha = isSpeaking ? 0.12 + amplitude * 0.22 : 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-5 md:p-8 relative overflow-hidden select-none">

            {/* Ambient background tint */}
            <AnimatePresence>
                {aiStatus !== AI_STATUS.READY && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9 }}
                        className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
                            isListening  ? 'bg-primary/[0.04] dark:bg-primary/[0.08]'         :
                            isProcessing ? 'bg-purple-500/[0.03] dark:bg-purple-500/[0.07]'   :
                            isSpeaking   ? 'bg-teal-500/[0.025] dark:bg-teal-500/[0.055]'     : ''
                        }`}
                    />
                )}
            </AnimatePresence>

            {/* Ripple rings — LISTENING */}
            {isListening && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {[0, 0.5, 1.0].map((delay, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-primary/20 animate-ripple"
                            style={{
                                width:  `${220 + i * 24}px`,
                                height: `${220 + i * 24}px`,
                                animationDelay: `${delay}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Rotating conic ring — PROCESSING */}
            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                        className="rounded-full"
                        style={{
                            width: '288px',
                            height: '288px',
                            background:
                                'conic-gradient(from 0deg, transparent 62%, rgba(139,92,246,0.42) 100%)',
                        }}
                    />
                </div>
            )}

            {/* Avatar */}
            <div className="relative z-10 flex items-center justify-center">

                <motion.div
                    animate={{
                        opacity: isListening  ? 0.58 :
                                 isProcessing ? 0.30 :
                                 isSpeaking   ? [0.38, 0.55, 0.38] : 0.14,
                        scale:   isListening  ? 1.05 :
                                 isProcessing ? 1.02 :
                                 isSpeaking   ? [1, 1.03, 1] : 1,
                    }}
                    transition={{
                        duration: isSpeaking || isListening ? 1.3 : 0.6,
                        repeat:   isSpeaking || isListening ? Infinity : 0,
                        ease: 'easeInOut',
                    }}
                    className={`absolute rounded-full border ${
                        isListening  ? 'border-primary/35'    :
                        isProcessing ? 'border-purple-400/22' :
                        isSpeaking   ? 'border-primary/26'    :
                                       'border-primary/10'
                    }`}
                    style={{ width: '288px', height: '288px' }}
                />

                <motion.div
                    animate={{ y: isSpeaking ? [0, -3, 0, -2, 0] : [0, -2, 0] }}
                    transition={{
                        duration: isSpeaking ? 1.2 : 4.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ width: '260px', height: '260px' }}
                    className="relative flex items-center justify-center"
                >
                    <AvatarFace
                        mouthGap={mouthGap}
                        eyeBlinkScale={eyeBlinkScale}
                        eyeGlowOpacity={eyeGlowOpacity}
                    />
                </motion.div>

                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        boxShadow: `0 0 ${speakingGlowPx}px rgba(37,99,235,${speakingGlowAlpha})`,
                        transition: 'box-shadow 0.06s ease-out',
                    }}
                />
            </div>

            {/* Status chip */}
            <motion.div
                key={aiStatus}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mt-5 md:mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-black/5 dark:border-white/5 shadow-sm z-10"
            >
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className="text-xs font-medium text-text-muted tracking-wide">
                    {config.label}
                </span>
            </motion.div>

            {/* Subtitle / transcript overlay */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none">
                <AnimatePresence mode="wait">

                    {isListening && liveTranscript && (
                        <motion.div
                            key="user-transcript"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-5 py-2.5 rounded-2xl bg-black/52 dark:bg-black/68 backdrop-blur-md text-white text-sm max-w-[90%] text-center"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                                <span className="leading-relaxed">{liveTranscript}</span>
                            </span>
                        </motion.div>
                    )}

                    {isSpeaking && displayedSubtitle && (
                        <motion.div
                            key={`sub-${displayedSubtitle}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.22 }}
                            className="px-5 py-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 backdrop-blur-md text-text text-sm max-w-[90%] text-center border border-primary/10"
                        >
                            <span className="flex items-start justify-center gap-2">
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                                <span className="leading-relaxed">{displayedSubtitle}</span>
                            </span>
                        </motion.div>
                    )}

                    {isListening && !liveTranscript && (
                        <motion.div
                            key="listening-idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-5 py-2.5 rounded-2xl bg-black/38 dark:bg-black/58 backdrop-blur-md text-white/80 text-sm text-center"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Speak now…
                            </span>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default AiAvatar;

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { useAudioAmplitude } from '../../hooks/useAudioAmplitude';

// ─── Status chip config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    [AI_STATUS.READY]: { label: 'AI Ready', dot: 'bg-green-400' },
    [AI_STATUS.LISTENING]: { label: 'Listening…', dot: 'bg-blue-400 animate-pulse' },
    [AI_STATUS.PROCESSING]: { label: 'Processing…', dot: 'bg-purple-400 animate-bounce' },
    [AI_STATUS.SPEAKING]: { label: 'Speaking…', dot: 'bg-teal-400 animate-pulse' },
};

// ─── SVG DEFS ─────────────────────────────────────────────────────────────────
const SvgDefs = () => (
    <defs>

        {/* ═══ SKIN — warm peachy-tan matching image ════════════════════════ */}
        <radialGradient id="av-skin" cx="44%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#F6DCC4" />
            <stop offset="22%" stopColor="#EBC090" />
            <stop offset="55%" stopColor="#D8A070" />
            <stop offset="100%" stopColor="#C08050" />
        </radialGradient>

        {/* 3-point lighting – left fill shadow (stronger for definition) */}
        <linearGradient id="av-shadow-l" x1="0" y1="0.5" x2="0.45" y2="0.5">
            <stop offset="0%" stopColor="#7A3C18" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#7A3C18" stopOpacity="0" />
        </linearGradient>
        {/* 3-point lighting – right rim shadow */}
        <linearGradient id="av-shadow-r" x1="1" y1="0.5" x2="0.55" y2="0.5">
            <stop offset="0%" stopColor="#603018" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#603018" stopOpacity="0" />
        </linearGradient>
        {/* Under-chin ambient occlusion */}
        <linearGradient id="av-shadow-b" x1="0.5" y1="1" x2="0.5" y2="0.70">
            <stop offset="0%" stopColor="#5A2C08" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#5A2C08" stopOpacity="0" />
        </linearGradient>

        {/* ═══ SKIN TEXTURE ═══════════════════════════════════════════════
            fractalNoise overlay at very low opacity simulates pore/skin grain
        ════════════════════════════════════════════════════════════════ */}
        <filter id="av-skin-texture" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72 0.68"
                numOctaves="4" seed="8" result="noise" />
            <feColorMatrix type="matrix"
                values="0 0 0 0 0.95
                        0 0 0 0 0.72
                        0 0 0 0 0.50
                        0 0 0 0.018 0"
                in="noise" result="tintedNoise" />
            <feComposite in="tintedNoise" in2="SourceGraphic" operator="in" />
        </filter>

        {/* ═══ HAIR — dark warm brown matching image ═══════════════════════ */}
        <linearGradient id="av-hair" x1="0.14" y1="0" x2="0.46" y2="1">
            <stop offset="0%" stopColor="#2C1A10" />
            <stop offset="35%" stopColor="#3E2818" />
            <stop offset="70%" stopColor="#281408" />
            <stop offset="100%" stopColor="#1A0C06" />
        </linearGradient>
        <linearGradient id="av-hair-side" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#281608" />
            <stop offset="55%" stopColor="#1E0E06" />
            <stop offset="100%" stopColor="#140A04" />
        </linearGradient>

        {/* ═══ CLOTHING — light periwinkle-blue scrubs matching image ═════ */}
        <linearGradient id="av-cloth" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#90C8DC" />
            <stop offset="50%" stopColor="#76B8D0" />
            <stop offset="100%" stopColor="#5EA4BE" />
        </linearGradient>
        <linearGradient id="av-coat" x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor="#A4D2E4" />
            <stop offset="100%" stopColor="#80C0D8" />
        </linearGradient>

        {/* ═══ NECK ═══════════════════════════════════════════════════════ */}
        <linearGradient id="av-neck" x1="0.22" y1="0" x2="0.78" y2="1">
            <stop offset="0%" stopColor="#E8C890" />
            <stop offset="100%" stopColor="#C8A060" />
        </linearGradient>

        {/* ═══ LIPS — peachy-nude matching image ══════════════════════════ */}
        <linearGradient id="av-lip-upper" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#C48868" />
            <stop offset="55%" stopColor="#B87050" />
            <stop offset="100%" stopColor="#A85A40" />
        </linearGradient>
        <linearGradient id="av-lip-lower" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#C08070" />
            <stop offset="42%" stopColor="#B06858" />
            <stop offset="100%" stopColor="#9E5848" />
        </linearGradient>

        {/* ═══ IRIS — steel grey-blue matching image ═══════════════════════ */}
        <radialGradient id="av-iris" cx="34%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#9AC0D4" />
            <stop offset="18%" stopColor="#6890B0" />
            <stop offset="52%" stopColor="#3C6488" />
            <stop offset="100%" stopColor="#1C3C60" />
        </radialGradient>

        {/* ═══ AURA ═══════════════════════════════════════════════════════ */}
        <radialGradient id="av-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.07" />
            <stop offset="55%" stopColor="#2563EB" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>

        {/* ═══ EYE CLIP PATHS — almond with slight cat-eye tilt ═══════════ */}
        <clipPath id="av-clip-leye">
            <path d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z" />
        </clipPath>
        <clipPath id="av-clip-reye">
            <path d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z" />
        </clipPath>

        {/* ═══ FILTERS ════════════════════════════════════════════════════ */}
        <filter id="av-eye-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
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
const Eye = ({ eyeBlinkScale, eyeGlowOpacity, clipId, dartX, dartY }) => (
    <g transform={`scale(1, ${eyeBlinkScale})`}>

        {/* Eye white — clean bright white matching illustration */}
        <path
            d="M -29,3 C -22,-13 -2,-17 28,-3 C 16,10 -12,12 -29,3 Z"
            fill="#F2EEE8"
            clipPath={`url(#${clipId})`}
        />

        {/* Upper-lid shadow cast onto white */}
        <path
            d="M -29,3 C -22,-13 -2,-17 28,-3 C 14,-6 -4,-8 -29,-2 Z"
            fill="#B08868"
            opacity="0.16"
            clipPath={`url(#${clipId})`}
        />

        <g transform={`translate(${dartX}, ${dartY})`}>
            {/* Iris */}
            <ellipse cx="0" cy="-1" rx="12.5" ry="12.5"
                fill="url(#av-iris)" clipPath={`url(#${clipId})`} />

            {/* Iris radial texture spokes — steel blue */}
            {Array.from({ length: 8 }, (_, i) => {
                const a = (i * 22.5) * Math.PI / 180;
                return (
                    <line key={i}
                        x1={Math.cos(a) * 5.5} y1={Math.sin(a) * 5.5 - 1}
                        x2={Math.cos(a) * 12} y2={Math.sin(a) * 12 - 1}
                        stroke="#1C3C58" strokeWidth="0.5" opacity="0.28"
                        clipPath={`url(#${clipId})`}
                    />
                );
            })}

            {/* Limbal ring — dark rim of iris */}
            <ellipse cx="0" cy="-1" rx="12.5" ry="12.5"
                fill="none" stroke="#0A1C30" strokeWidth="2" opacity="0.70"
                clipPath={`url(#${clipId})`} />

            {/* Pupil — deep black */}
            <ellipse cx="0.3" cy="-0.5" rx="6" ry="6"
                fill="#02050A" clipPath={`url(#${clipId})`} />
            <ellipse cx="-1.5" cy="-1.5" rx="2" ry="1.6"
                fill="#060E1C" opacity="0.50" clipPath={`url(#${clipId})`} />
        </g>

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

        {/* Upper eyelid skin — warmer, matches skin tone */}
        <path d="M -29,3 C -22,-13 -2,-17 28,-3"
            fill="#D8A878" opacity="0.35" clipPath={`url(#${clipId})`} />

        {/* Upper lash line — bold, well-defined */}
        <path d="M -29,2 C -20,-14 -2,-18 28,-4"
            stroke="#080402" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Outer corner lash flick — cat-eye tilt like image */}
        <path d="M 20,-7 C 25,-12 32,-11 34,-6"
            stroke="#080402" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Inner lash taper */}
        <path d="M -29,2 C -26,-2 -24,-4 -22,-5"
            stroke="#0C0604" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.70" />

        {/* Lower lash line — subtle */}
        <path d="M -29,3 C -12,12 14,10 28,-3"
            fill="none" stroke="#A08060" strokeWidth="1.1" opacity="0.28" />

        {/* No tear duct / inner corner element — clean eye corner */}

    </g>
);

// ─── AVATAR FACE SVG ──────────────────────────────────────────────────────────
const AvatarFace = ({ mouthGap, eyeBlinkScale, eyeGlowOpacity, headSwayX, headSwayY, headRotate, dartX, dartY }) => (
    <motion.svg
        animate={{ x: headSwayX, y: headSwayY, rotate: headRotate }}
        transition={{ duration: 0.1, ease: "linear" }}
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
            d="M 0 500 Q 20 416 80 384 L 134 362 L 200 378 L 266 362 L 320 384 Q 380 416 400 500 Z"
            fill="url(#av-cloth)"
        />
        <path
            d="M 130 362 Q 164 390 200 382 Q 236 390 270 362 L 256 350 Q 232 375 200 369 Q 168 375 144 350 Z"
            fill="url(#av-coat)"
        />
        <path d="M 142 353 Q 170 377 200 369"
            fill="none" stroke="#C8D8E8" strokeWidth="1.2" opacity="0.60" />
        <path d="M 258 353 Q 230 377 200 369"
            fill="none" stroke="#C8D8E8" strokeWidth="1.2" opacity="0.60" />
        <line x1="200" y1="382" x2="200" y2="404"
            stroke="#B8CCE0" strokeWidth="1.2" opacity="0.45" />
        {/* Collarbone hint — visible in reference image */}
        <path d="M 134 368 Q 168 374 200 370 Q 232 374 266 368"
            fill="none" stroke="#D8A870" strokeWidth="1.8" opacity="0.22" strokeLinecap="round" />

        {/* ═══════════════════════════════════════════════════════════════
            NECK
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="M 184 348 Q 182 366 185 382 L 215 382 Q 218 366 216 348 Z"
            fill="url(#av-neck)"
        />
        <path d="M 186 350 Q 187 368 186 381"
            fill="none" stroke="#C0A888" strokeWidth="1.4" opacity="0.24" />
        <path d="M 214 350 Q 213 368 214 381"
            fill="none" stroke="#C0A888" strokeWidth="1.4" opacity="0.24" />
        <ellipse cx="200" cy="383" rx="18" ry="3.2"
            fill="#B89878" opacity="0.16" />

        {/* ═══════════════════════════════════════════════════════════════
            HEAD SHAPE  — OVAL face
            Narrower at cheekbones (x 78→322 = 244 px)
            Slightly more elongated chin → defined oval jaw
            Width/visible-height ratio ≈ 0.76  (oval!)
        ════════════════════════════════════════════════════════════════ */}
        <path
            d="
                M 200,54
                C 292,48  324,134  324,200
                C 324,276  300,332  244,357
                C 226,369  212,377  200,379
                C 188,377  174,369  156,357
                C 100,332   76,276   76,200
                C  76,134  108,48   200,54 Z
            "
            fill="url(#av-skin)"
            filter="url(#av-face-shadow)"
        />

        {/* Skin micro-texture overlay — same path, fractalNoise filter */}
        <path
            d="
                M 200,54
                C 292,48  324,134  324,200
                C 324,276  300,332  244,357
                C 226,369  212,377  200,379
                C 188,377  174,369  156,357
                C 100,332   76,276   76,200
                C  76,134  108,48   200,54 Z
            "
            fill="white"
            opacity="1"
            filter="url(#av-skin-texture)"
        />

        {/* ─── 3-point lighting shadows ──────────────────────────────── */}
        <path
            d="M 200,54 C 108,48 76,134 76,200 C 76,276 100,332 156,357
               C 174,369 188,377 200,379 L 200,54 Z"
            fill="url(#av-shadow-l)"
        />
        <path
            d="M 200,54 C 292,48 324,134 324,200 C 324,276 300,332 244,357
               C 226,369 212,377 200,379 L 200,54 Z"
            fill="url(#av-shadow-r)"
        />
        <path
            d="M 158,359 C 178,376 222,376 242,359
               Q 220,381 200,381 Q 180,381 158,359 Z"
            fill="url(#av-shadow-b)"
        />

        {/* ═══════════════════════════════════════════════════════════════
            EARS  — adjusted to match oval face (x≈76/324)
        ════════════════════════════════════════════════════════════════ */}
        <path d="M 76,200 Q 68,220 72,238 Q 78,250 85,243
                 Q 88,230 83,216 Q 80,207 76,200 Z"
            fill="#D8A870" />
        <path d="M 324,200 Q 332,220 328,238 Q 322,250 315,243
                 Q 312,230 317,216 Q 320,207 324,200 Z"
            fill="#D8A870" />
        <path d="M 74,208 Q 71,224 74,240"
            fill="none" stroke="#C0A082" strokeWidth="1.1" opacity="0.28" />
        <path d="M 326,208 Q 329,224 326,240"
            fill="none" stroke="#C0A082" strokeWidth="1.1" opacity="0.28" />

        {/* ═══════════════════════════════════════════════════════════════
            HAIR  — wide flowing dark brown, framing the face like image
        ════════════════════════════════════════════════════════════════ */}

        {/* ── LEFT wide side strand (extends ~55px beyond face edge) ── */}
        <path
            d="
                M 76,196
                Q 48,238  26,308
                Q 16,350  18,405
                Q 36,372  54,334
                Q 66,302  72,268
                Q 75,234  76,212 Z
            "
            fill="#1E1008"
        />
        {/* Left inner strand — lighter warm-brown to show hair depth */}
        <path
            d="
                M 76,200
                Q 54,244  38,310
                Q 30,348  34,390
                Q 50,360  62,324
                Q 70,296  74,264
                Q 76,238  76,216 Z
            "
            fill="#2C1A0E"
            opacity="0.80"
        />
        {/* Left hair flow texture streaks */}
        <path d="M 70,224 Q 44,272 30,322"
            stroke="#3E2414" strokeWidth="2.2" fill="none" opacity="0.26" />
        <path d="M 62,248 Q 36,292 24,340"
            stroke="#3E2414" strokeWidth="1.6" fill="none" opacity="0.18" />
        {/* Left subtle highlight streak (light catches straight hair) */}
        <path d="M 74,228 Q 58,270 50,314"
            stroke="#4A3020" strokeWidth="3.5" fill="none" opacity="0.22" strokeLinecap="round"/>

        {/* ── RIGHT wide side strand ── */}
        <path
            d="
                M 324,196
                Q 352,238  374,308
                Q 384,350  382,405
                Q 364,372  346,334
                Q 334,302  328,268
                Q 325,234  324,212 Z
            "
            fill="#1E1008"
        />
        {/* Right inner strand */}
        <path
            d="
                M 324,200
                Q 346,244  362,310
                Q 370,348  366,390
                Q 350,360  338,324
                Q 330,296  326,264
                Q 324,238  324,216 Z
            "
            fill="#2C1A0E"
            opacity="0.80"
        />
        {/* Right hair flow texture streaks */}
        <path d="M 330,224 Q 356,272 370,322"
            stroke="#3E2414" strokeWidth="2.2" fill="none" opacity="0.26" />
        <path d="M 338,248 Q 364,292 376,340"
            stroke="#3E2414" strokeWidth="1.6" fill="none" opacity="0.18" />
        {/* Right subtle highlight streak */}
        <path d="M 326,228 Q 342,270 350,314"
            stroke="#4A3020" strokeWidth="3.5" fill="none" opacity="0.22" strokeLinecap="round"/>

        {/* ── Crown hair (top of head) ── */}
        <path
            d="
                M 76,200
                Q 64,118   94,74
                Q 128,24   200,16
                Q 272,24   306,74
                Q 336,118  324,200
                Q 312,148  284,116
                Q 248,78   200,76
                Q 152,78   116,116
                Q  88,148   76,200 Z
            "
            fill="url(#av-hair)"
        />
        {/* Crown shine — catches key light */}
        <path d="M 150,76 Q 182,48 218,52"
            stroke="#3C2412" strokeWidth="7" fill="none"
            strokeLinecap="round" opacity="0.32" />
        <path d="M 170,60 Q 198,42 226,48"
            stroke="#4A2C16" strokeWidth="3.5" fill="none"
            strokeLinecap="round" opacity="0.22" />
        {/* Hair part line (slightly left of center) */}
        <path d="M 200,18 Q 203,48 202,78"
            stroke="#4A3020" strokeWidth="2.5" fill="none"
            strokeLinecap="round" opacity="0.20" />
        {/* Hairline softener */}
        <path
            d="M 116,116 Q 130,104 146,96 Q 164,88 184,84
               Q 200,82 216,84 Q 236,88 254,96
               Q 270,104 284,116"
            fill="none" stroke="url(#av-hair)"
            strokeWidth="6" opacity="0.60"
        />

        {/* ═══════════════════════════════════════════════════════════════
            EYE SOCKET DEPTH — stronger definition like image
        ════════════════════════════════════════════════════════════════ */}
        <ellipse cx="160" cy="194" rx="38" ry="22"
            fill="#7A4020" opacity="0.10" filter="url(#av-soft)" />
        <ellipse cx="240" cy="194" rx="38" ry="22"
            fill="#7A4020" opacity="0.10" filter="url(#av-soft)" />
        {/* Upper eyelid crease shadow */}
        <path d="M 134 180 Q 160 174 186 180"
            fill="none" stroke="#8A5030" strokeWidth="3" opacity="0.12" filter="url(#av-soft)" />
        <path d="M 214 180 Q 240 174 266 180"
            fill="none" stroke="#8A5030" strokeWidth="3" opacity="0.12" filter="url(#av-soft)" />

        {/* ═══════════════════════════════════════════════════════════════
            EYEBROWS — filled arched shapes matching image
        ════════════════════════════════════════════════════════════════ */}
        {/* Left eyebrow — filled arch */}
        <path
            d="M 127,172 Q 140,156 158,150 Q 173,146 190,155
               L 188,161 Q 173,153 158,157 Q 141,163 129,178 Z"
            fill="#18100A" opacity="0.90"
        />
        {/* Left brow soft edge top */}
        <path d="M 127,172 Q 143,155 162,149 Q 176,145 190,155"
            stroke="#241408" strokeWidth="1.4" fill="none"
            strokeLinecap="round" opacity="0.38" />

        {/* Right eyebrow — filled arch */}
        <path
            d="M 210,155 Q 227,146 244,150 Q 262,156 273,172
               L 271,178 Q 259,163 242,157 Q 225,153 210,161 Z"
            fill="#18100A" opacity="0.90"
        />
        {/* Right brow soft edge top */}
        <path d="M 210,155 Q 224,145 242,149 Q 259,155 273,172"
            stroke="#241408" strokeWidth="1.4" fill="none"
            strokeLinecap="round" opacity="0.38" />

        {/* Brow under-shadow for 3D depth */}
        <path d="M 130,175 Q 158,167 188,173"
            fill="none" stroke="#A06840" strokeWidth="4" opacity="0.10" />
        <path d="M 212,173 Q 242,167 270,175"
            fill="none" stroke="#A06840" strokeWidth="4" opacity="0.10" />

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
            <Eye eyeBlinkScale={eyeBlinkScale} eyeGlowOpacity={eyeGlowOpacity} clipId="av-clip-leye" dartX={dartX} dartY={dartY} />
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
            <Eye eyeBlinkScale={eyeBlinkScale} eyeGlowOpacity={eyeGlowOpacity} clipId="av-clip-reye" dartX={dartX} dartY={dartY} />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            NOSE — straight refined bridge with defined tip/nostrils
        ════════════════════════════════════════════════════════════════ */}
        {/* Bridge highlight — straight */}
        <path d="M 200 220 Q 199 248 199 262"
            fill="none" stroke="#F8E8D8" strokeWidth="4"
            strokeLinecap="round" opacity="0.50" />
        {/* Left nose shadow — defines the bridge */}
        <path d="M 195 222 Q 188 248 190 266"
            fill="none" stroke="#C09068" strokeWidth="1.8"
            strokeLinecap="round" opacity="0.50" />
        {/* Right nose shadow */}
        <path d="M 205 222 Q 212 248 210 266"
            fill="none" stroke="#C09068" strokeWidth="1.8"
            strokeLinecap="round" opacity="0.50" />
        {/* Nose tip soft highlight */}
        <ellipse cx="200" cy="266" rx="6" ry="4.5"
            fill="white" opacity="0.18" />
        {/* Left nostril — more defined curve */}
        <path d="M 188 264 C 182 270 183 277 190 274 Q 193 273 195 268"
            fill="none" stroke="#A87858" strokeWidth="2"
            strokeLinecap="round" opacity="0.55" />
        {/* Right nostril */}
        <path d="M 212 264 C 218 270 217 277 210 274 Q 207 273 205 268"
            fill="none" stroke="#A87858" strokeWidth="2"
            strokeLinecap="round" opacity="0.55" />
        {/* Nostril shadow depth */}
        <ellipse cx="190" cy="271" rx="4" ry="2.5" fill="#906040" opacity="0.28" />
        <ellipse cx="210" cy="271" rx="4" ry="2.5" fill="#906040" opacity="0.28" />

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

        {/* Forehead key light — center bright zone */}
        <ellipse cx="200" cy="120" rx="60" ry="38"
            fill="white" opacity="0.075" filter="url(#av-soft)" />

        {/* Nose bridge glow */}
        <ellipse cx="200" cy="240" rx="7" ry="26"
            fill="white" opacity="0.065" filter="url(#av-soft)" />

        {/* Cheekbone highlights — high, prominent like image */}
        <ellipse cx="118" cy="228" rx="32" ry="14"
            fill="white" opacity="0.095" filter="url(#av-soft)" />
        <ellipse cx="282" cy="228" rx="32" ry="14"
            fill="white" opacity="0.095" filter="url(#av-soft)" />

        {/* Cheekbone under-shadow — gives 3D prominent cheek look */}
        <ellipse cx="108" cy="258" rx="28" ry="12"
            fill="#8A5028" opacity="0.10" filter="url(#av-soft)" />
        <ellipse cx="292" cy="258" rx="28" ry="12"
            fill="#8A5028" opacity="0.10" filter="url(#av-soft)" />

        {/* Natural blush — warm peachy pink matching image */}
        <ellipse cx="116" cy="244" rx="30" ry="15"
            fill="#E09060" opacity="0.082" filter="url(#av-soft)" />
        <ellipse cx="284" cy="244" rx="30" ry="15"
            fill="#E09060" opacity="0.082" filter="url(#av-soft)" />

        {/* Under-lip shadow */}
        <ellipse cx="200" cy="316" rx="18" ry="5"
            fill="#906040" opacity="0.14" />

        {/* Chin ambient occlusion */}
        <ellipse cx="200" cy="371" rx="28" ry="8"
            fill="#B09060" opacity="0.12" />
    </motion.svg>
);

// ─── MAIN AVATAR COMPONENT ────────────────────────────────────────────────────
const AiAvatar = ({ videoRef = null, didStreamReady = false }) => {
    const {
        aiStatus,
        liveTranscript,
        activeSubtitle,
        currentAudioElement,
    } = useAppStore();

    const config = STATUS_CONFIG[aiStatus];
    const isSpeaking = aiStatus === AI_STATUS.SPEAKING;
    const isListening = aiStatus === AI_STATUS.LISTENING;
    const isProcessing = aiStatus === AI_STATUS.PROCESSING;

    const [dartX, setDartX] = useState(0);
    const [dartY, setDartY] = useState(0);
    const dartRef = useRef(null);
    useEffect(() => {
        const scheduleDart = () => {
            dartRef.current = setTimeout(() => {
                setDartX((Math.random() - 0.5) * 3);
                setDartY((Math.random() - 0.5) * 2);
                scheduleDart();
            }, 800 + Math.random() * 3000);
        };
        scheduleDart();
        return () => clearTimeout(dartRef.current);
    }, []);

    const [timeVal, setTimeVal] = useState(0);
    useEffect(() => {
        let reqId;
        const tick = () => { setTimeVal(Date.now() / 1000); reqId = requestAnimationFrame(tick); };
        reqId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(reqId);
    }, []);

    // ── Amplitude → lip-sync ─────────────────────────────────────────────
    const rawAmplitude = useAudioAmplitude(currentAudioElement);
    const amplitude = rawAmplitude > 0.06
        ? Math.min((rawAmplitude - 0.06) / 0.94, 1)
        : 0;
    const mouthGap = isSpeaking ? amplitude * 18 : 0;

    const headSwayX = Math.sin(timeVal * 0.5) * 1.5;
    const headSwayY = isSpeaking ? (Math.sin(timeVal * 6) * 1.5 - amplitude * 4) : Math.sin(timeVal * 1.2) * 2;
    const headRotate = Math.sin(timeVal * 0.4) * 0.8;

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
        subtitleTimerRef.current = setTimeout(() => {
            if (activeSubtitle && isSpeaking) {
                setDisplayedSubtitle(activeSubtitle);
            } else {
                setDisplayedSubtitle('');
            }
        }, 0);
        return () => clearTimeout(subtitleTimerRef.current);
    }, [activeSubtitle, isSpeaking]);

    // ── Speaking halo ────────────────────────────────────────────────────
    const speakingGlowPx = isSpeaking ? 38 + amplitude * 38 : 0;
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
                        className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${isListening ? 'bg-primary/[0.04] dark:bg-primary/[0.08]' :
                                isProcessing ? 'bg-purple-500/[0.03] dark:bg-purple-500/[0.07]' :
                                    isSpeaking ? 'bg-teal-500/[0.025] dark:bg-teal-500/[0.055]' : ''
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
                                width: `${220 + i * 24}px`,
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
                        opacity: isListening ? 0.58 :
                            isProcessing ? 0.30 :
                                isSpeaking ? [0.38, 0.55, 0.38] : 0.14,
                        scale: isListening ? 1.05 :
                            isProcessing ? 1.02 :
                                isSpeaking ? [1, 1.03, 1] : 1,
                    }}
                    transition={{
                        duration: isSpeaking || isListening ? 1.3 : 0.6,
                        repeat: isSpeaking || isListening ? Infinity : 0,
                        ease: 'easeInOut',
                    }}
                    className={`absolute rounded-full border ${isListening ? 'border-primary/35' :
                            isProcessing ? 'border-purple-400/22' :
                                isSpeaking ? 'border-primary/26' :
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
                        headSwayX={headSwayX}
                        headSwayY={headSwayY}
                        headRotate={headRotate}
                        dartX={dartX}
                        dartY={dartY}
                    />

                    {/* D-ID live video overlay — shown when WebRTC stream is ready */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute rounded-full object-cover pointer-events-none"
                        style={{
                            width: '230px',
                            height: '230px',
                            opacity: didStreamReady ? 1 : 0,
                            transition: 'opacity 0.6s ease-in-out',
                        }}
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

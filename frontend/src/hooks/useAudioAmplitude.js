import { useEffect, useRef, useState } from 'react';

// Module-level AudioContext — reused across all TTS chunks to avoid
// hitting the browser limit on concurrent AudioContext instances.
let _sharedCtx = null;
function getSharedCtx() {
    if (!_sharedCtx || _sharedCtx.state === 'closed') {
        _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _sharedCtx;
}

/**
 * Reads real-time amplitude from an HTMLAudioElement via Web Audio API.
 *
 * Returns a smoothed 0–1 value suitable for driving mouth open/close animation.
 * Each new audioElement triggers a fresh analyser + source chain; cleanup
 * disconnects nodes without closing the shared AudioContext.
 *
 * @param {HTMLAudioElement|null} audioElement
 * @returns {number} Smoothed amplitude 0–1
 */
export function useAudioAmplitude(audioElement) {
    const [amplitude, setAmplitude] = useState(0);
    const analyserRef = useRef(null);
    const sourceRef   = useRef(null);
    const rafRef      = useRef(null);
    const smoothRef   = useRef(0);

    useEffect(() => {
        // No element → go silent immediately
        if (!audioElement) {
            cancelAnimationFrame(rafRef.current);
            smoothRef.current = 0;
            setAmplitude(0);
            return;
        }

        let ctx;
        try {
            ctx = getSharedCtx();
        } catch {
            return; // Web Audio not available (SSR / very old browser)
        }

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // ── Analyser setup ────────────────────────────────────────────────
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72; // internal FFT smoothing
        analyserRef.current = analyser;

        // Connect: mediaElement → analyser → speakers
        let source;
        try {
            source = ctx.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            sourceRef.current = source;
        } catch {
            // Element was already connected (rare); still wire analyser out
            try { analyser.connect(ctx.destination); } catch { /* ignore */ }
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // ── RAF loop ──────────────────────────────────────────────────────
        const tick = () => {
            analyser.getByteFrequencyData(dataArray);

            // Average the first ~72 bins — covers the 0–4 kHz voice range
            const count = Math.min(72, dataArray.length);
            let sum = 0;
            for (let i = 0; i < count; i++) sum += dataArray[i];
            const avg = sum / count;

            // Normalise: empirical ceiling of ~85 keeps the range practical
            const normalised = Math.min(avg / 85, 1);

            // Exponential smoothing — fast attack, slower release
            const prev = smoothRef.current;
            smoothRef.current =
                normalised > prev
                    ? prev * 0.45 + normalised * 0.55 // attack
                    : prev * 0.70 + normalised * 0.30; // release

            setAmplitude(smoothRef.current);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            try {
                if (source) source.disconnect();
                analyser.disconnect();
            } catch { /* ignore */ }
            smoothRef.current = 0;
            setAmplitude(0);
        };
    }, [audioElement]);

    return amplitude;
}

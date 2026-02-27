import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Plus, Trash2, X, ChevronDown, Check, Loader2, AlertTriangle
} from 'lucide-react';
import { fetchUserAllergies, updateUserAllergies } from '../../services/api';

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const SEVERITY_STYLES = {
  low:      { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',  dot: 'bg-emerald-400'  },
  medium:   { pill: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',    dot: 'bg-amber-400'    },
  high:     { pill: 'bg-orange-100  text-orange-700  dark:bg-orange-900/40  dark:text-orange-400',   dot: 'bg-orange-400'   },
  critical: { pill: 'bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-400',      dot: 'bg-red-500'      },
};

const COMMON_ALLERGENS = [
  'Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Codeine',
  'Latex', 'Peanuts', 'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat',
];

// ── Small sub-components ────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function SeverityDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-medium text-text hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[100px]"
      >
        <span className={`w-2 h-2 rounded-full ${SEVERITY_STYLES[value]?.dot}`} />
        <span className="capitalize flex-1 text-left">{value}</span>
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit  ={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 w-full bg-card border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            {SEVERITY_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors capitalize"
              >
                <span className={`w-2 h-2 rounded-full ${SEVERITY_STYLES[opt]?.dot}`} />
                {opt}
                {opt === value && <Check className="w-3 h-3 ml-auto text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AllergyRow({ entry, onChange, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit   ={{ opacity: 0, x:  12, transition: { duration: 0.15 } }}
      className="flex gap-2 items-start group"
    >
      {/* Allergen name */}
      <input
        type="text"
        placeholder="e.g. Penicillin"
        value={entry.allergen}
        onChange={e => onChange({ ...entry, allergen: e.target.value })}
        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />

      {/* Severity */}
      <SeverityDropdown value={entry.severity} onChange={sev => onChange({ ...entry, severity: sev })} />

      {/* Reaction (optional) */}
      <input
        type="text"
        placeholder="Reaction (optional)"
        value={entry.reaction}
        onChange={e => onChange({ ...entry, reaction: e.target.value })}
        className="w-36 hidden sm:block px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2 mt-0.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
        title="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────

const AllergySetupModal = ({ isOpen, onClose, isFirstTime = false }) => {
  const [allergies, setAllergies]     = useState([]);
  const [saving,    setSaving]        = useState(false);
  const [loading,   setLoading]       = useState(true);
  const [error,     setError]         = useState(null);
  const [saved,     setSaved]         = useState(false);

  // Load existing allergies when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetchUserAllergies()
      .then(res => setAllergies(res.allergies || []))
      .catch(() => setAllergies([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const addRow = () =>
    setAllergies(prev => [...prev, { allergen: '', severity: 'medium', reaction: '' }]);

  const addCommon = (name) => {
    if (allergies.find(a => a.allergen.toLowerCase() === name.toLowerCase())) return;
    setAllergies(prev => [...prev, { allergen: name, severity: 'medium', reaction: '' }]);
  };

  const updateRow = (idx, updated) =>
    setAllergies(prev => prev.map((a, i) => (i === idx ? updated : a)));

  const removeRow = (idx) =>
    setAllergies(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const valid = allergies.filter(a => a.allergen.trim() !== '');
    setSaving(true);
    setError(null);
    try {
      await updateUserAllergies(valid);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 900);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const alreadyAdded = (name) =>
    allergies.some(a => a.allergen.toLowerCase() === name.toLowerCase());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit   ={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isFirstTime ? undefined : onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit   ={{ opacity: 0, scale: 0.95, y: 20  }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* ── Header gradient banner ── */}
            <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
              {/* Close button (only in edit mode) */}
              {!isFirstTime && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-text hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-4">
                {/* Icon badge */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center shadow-inner">
                    <ShieldAlert className="w-7 h-7 text-primary" />
                  </div>
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping opacity-40 pointer-events-none" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-text leading-tight">
                    {isFirstTime ? 'Welcome! Set Up Your Allergies' : 'My Allergy Profile'}
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5 leading-snug">
                    {isFirstTime
                      ? "Help us keep you safe. We'll block orders that could trigger your allergies."
                      : 'Your allergy list is used to flag dangerous medicine orders automatically.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Quick-add common allergens */}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Common Allergens — Quick Add
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addCommon(name)}
                      disabled={alreadyAdded(name)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                        ${alreadyAdded(name)
                          ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
                          : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                        }`}
                    >
                      {alreadyAdded(name) ? <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5" />{name}</span> : `+ ${name}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-black/5 dark:border-white/5" />

              {/* Allergy rows */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Your Allergy List
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-8 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {allergies.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit   ={{ opacity: 0 }}
                        className="text-center py-8 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10"
                      >
                        <ShieldAlert className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                        <p className="text-sm text-text-muted">No allergies added yet.</p>
                        <p className="text-xs text-text-muted/60 mt-1">Use quick-add above or the button below.</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-2">
                        {allergies.map((entry, idx) => (
                          <AllergyRow
                            key={idx}
                            entry={entry}
                            onChange={u => updateRow(idx, u)}
                            onRemove={() => removeRow(idx)}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Add custom row */}
              <button
                type="button"
                onClick={addRow}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 text-sm text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add custom allergen
              </button>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current summary badges (decorative) */}
              {!loading && allergies.filter(a => a.allergen.trim()).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {allergies.filter(a => a.allergen.trim()).map((a, i) => (
                    <SeverityBadge key={i} severity={a.severity} />
                  ))}
                  <span className="text-xs text-text-muted self-center ml-1">
                    {allergies.filter(a => a.allergen.trim()).length} allerg{allergies.filter(a => a.allergen.trim()).length === 1 ? 'y' : 'ies'} on file
                  </span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between gap-3">
              {!isFirstTime && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              )}

              {isFirstTime && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-text-muted hover:text-text transition-colors underline underline-offset-2"
                >
                  Skip for now
                </button>
              )}

              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                whileTap={{ scale: 0.97 }}
                className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all
                  ${saved
                    ? 'bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/30'
                    : 'bg-primary hover:bg-primary/90 shadow-primary/20 dark:shadow-primary/10'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Saved!</>
                ) : (
                  <><ShieldAlert className="w-4 h-4" /> Save Allergies</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AllergySetupModal;

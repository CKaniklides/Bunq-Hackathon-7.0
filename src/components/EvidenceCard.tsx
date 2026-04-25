import { motion } from 'framer-motion';
import { FileText, Plane, Calendar, MessageSquare, Mic, CreditCard, Receipt, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { AnalyzedEvidence, EvidenceType } from '../types';

const TYPE_META: Record<EvidenceType, { icon: React.ComponentType<{ className?: string }>, color: string, bg: string, label: string }> = {
  bill: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Utility Bill' },
  receipt: { icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Receipt' },
  ticket: { icon: Plane, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Travel Ticket' },
  calendar: { icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', label: 'Calendar' },
  chat: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Chat Screenshot' },
  voice: { icon: Mic, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Voice Note' },
  payment: { icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Payment Record' },
};

const WAVEFORM = [3, 5, 7, 4, 8, 6, 9, 5, 7, 4, 6, 8, 5, 3, 7, 9, 4, 6, 8, 5, 4, 7, 6, 3, 8, 5, 7, 4, 6, 9];

const CONFIDENCE_COLOR: Record<string, string> = {
  'Very High': 'bg-emerald-100 text-emerald-700',
  'High': 'bg-green-100 text-green-700',
  'Medium-High': 'bg-blue-100 text-blue-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Low': 'bg-red-100 text-red-700',
};

interface Props {
  evidence: AnalyzedEvidence;
}

export default function EvidenceCard({ evidence }: Props) {
  const meta = TYPE_META[evidence.type];
  const Icon = meta.icon;

  if (evidence.status === 'analyzing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className={`${meta.bg} px-4 py-3 flex items-center gap-3`}>
          <div className={`${meta.bg} rounded-lg p-1.5 border border-white/50`}>
            <Icon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div className="flex-1">
            <div className="h-3.5 bg-white/60 rounded-full w-2/3 mb-1.5 animate-pulse" />
            <div className="h-2.5 bg-white/40 rounded-full w-1/2 animate-pulse" />
          </div>
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Claude is analyzing this document…</span>
          </div>
          <div className="space-y-1.5">
            {[0.8, 0.6, 0.7].map((w, i) => (
              <div key={i} className="h-2.5 bg-slate-100 rounded-full animate-pulse" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (evidence.status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">Analysis failed</p>
            <p className="text-xs text-red-600 mt-0.5 truncate">{evidence.error || 'Unknown error'}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className={`${meta.bg} px-4 py-3 flex items-start gap-3`}>
        <div className={`${meta.bg} rounded-lg p-1.5 border border-white/50 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight">{evidence.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{evidence.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONFIDENCE_COLOR[evidence.confidenceLabel] || 'bg-slate-100 text-slate-600'}`}>
            {evidence.confidenceLabel}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Date range */}
        {evidence.dateRange && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>{evidence.dateRange.start} – {evidence.dateRange.end}</span>
          </div>
        )}

        {/* Image preview */}
        {evidence.filePreviewUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <img src={evidence.filePreviewUrl} alt="Evidence" className="w-full max-h-36 object-cover" />
          </div>
        )}

        {/* Voice waveform visual */}
        {evidence.type === 'voice' && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="flex items-center gap-0.5 flex-1">
                {WAVEFORM.map((h, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-pink-400 rounded-full opacity-80"
                    style={{ height: `${h * 2.5}px` }}
                  />
                ))}
              </div>
            </div>
            {evidence.extractedFacts.length > 0 && (
              <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">
                {evidence.extractedFacts[0]}
              </p>
            )}
          </div>
        )}

        {/* Chat visual */}
        {evidence.type === 'chat' && evidence.extractedFacts.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Points</p>
            {evidence.extractedFacts.slice(0, 3).map((fact, i) => (
              <div key={i} className="text-xs text-slate-600">• {fact}</div>
            ))}
          </div>
        )}

        {/* Extracted facts (for non-chat/voice) */}
        {evidence.type !== 'chat' && evidence.type !== 'voice' && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Extracted Facts
            </p>
            <ul className="space-y-1">
              {evidence.extractedFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extracted facts for voice (full list) */}
        {evidence.type === 'voice' && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Extracted Facts
            </p>
            <ul className="space-y-1">
              {evidence.extractedFacts.slice(1).map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">AI Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${evidence.confidence}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">{evidence.confidence}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

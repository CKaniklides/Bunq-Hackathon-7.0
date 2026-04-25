import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, MessageCircle, Upload, CreditCard, TrendingDown, TrendingUp,
  Minus, Info, ShieldCheck, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';
import { Screen, AnalyzedEvidence, RecommendationResult, DisputeSetup, Participant } from '../../types';
import { generateRecommendation } from '../../utils/claudeApi';

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  apiKey: string;
  analyzedEvidence: AnalyzedEvidence[];
  recommendation: RecommendationResult | null;
  onRecommendationGenerated: (rec: RecommendationResult) => void;
  isGenerating: boolean;
  onSetGenerating: (v: boolean) => void;
}

const CONFIDENCE_COLOR: Record<string, { bar: string; badge: string; text: string }> = {
  High: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
  'Medium-high': { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: 'text-emerald-600' },
  Medium: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' },
  Low: { bar: 'bg-red-400', badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700' },
};

export default function RecommendationScreen({
  setup, onNavigate, apiKey, analyzedEvidence, recommendation,
  onRecommendationGenerated, isGenerating, onSetGenerating,
}: Props) {
  const [error, setError] = useState('');
  const { billTotal, participants } = setup;

  const payer: Participant = participants.reduce((max, p) => p.paidAmount > max.paidAmount ? p : max, participants[0]);

  const handleGenerate = async () => {
    setError('');
    onSetGenerating(true);
    try {
      const result = await generateRecommendation(apiKey, analyzedEvidence, setup);
      onRecommendationGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendation');
    } finally {
      onSetGenerating(false);
    }
  };

  const getParticipant = (id: string) => participants.find(p => p.id === id) ?? participants[0];
  const evidenceCount = analyzedEvidence.filter(e => e.status === 'done').length;

  if (!recommendation && !isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
            Step 5 of 6
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Suggested Fair Split</h1>
          <p className="text-slate-500 mt-1">Claude AI will analyze your evidence and generate a fair recommendation.</p>
        </div>

        {/* Evidence summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Evidence Ready for Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['bill', 'ticket', 'calendar', 'voice', 'chat', 'payment', 'email', 'note'] as const).map(type => {
              const count = analyzedEvidence.filter(e => e.type === type && e.status === 'done').length;
              return count > 0 ? (
                <div key={type} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-700">{count}</p>
                  <p className="text-xs text-slate-500 capitalize">{type}</p>
                </div>
              ) : null;
            })}
          </div>
          <p className="text-sm text-slate-500 mt-3">
            <span className="font-semibold text-slate-700">{evidenceCount}</span> evidence items will be analyzed.
            {evidenceCount < 3 && (
              <button
                onClick={() => onNavigate('evidence')}
                className="ml-2 text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
              >
                Add more for higher confidence
              </button>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Generation failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 py-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-10 py-4 rounded-2xl transition-colors flex items-center gap-3 shadow-md text-base"
          >
            <Sparkles className="w-5 h-5" />
            Generate AI Fair Split Recommendation
          </motion.button>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Claude AI will decompose the €{billTotal} bill into cost categories and calculate evidence-weighted fair shares for {participants.map(p => p.name).join(', ')}.
          </p>
        </div>
      </motion.div>
    );
  }

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
            Step 5 of 6
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Generating Recommendation…</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
          <p className="font-semibold text-slate-800 mb-1">Claude AI is analyzing {evidenceCount} evidence items</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Decomposing the €{billTotal} bill into cost categories, weighting by presence evidence, and calculating fair shares…
          </p>
          <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
            {[
              'Reading all submitted evidence…',
              'Identifying fixed vs. variable costs…',
              'Weighing presence & absence periods…',
              'Calculating per-person fair shares…',
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4 }}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                {step}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const rec = recommendation!;
  const conf = CONFIDENCE_COLOR[rec.confidenceLabel] || CONFIDENCE_COLOR['Medium'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
            Step 5 of 6
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Suggested Fair Split</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Non-binding recommendation · Based on {evidenceCount} evidence items</p>
            {rec.isAIGenerated && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI Generated
              </span>
            )}
          </div>
        </div>
        <div className={`border rounded-2xl px-4 py-3 text-center ${conf.badge}`}>
          <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-0.5">Confidence</p>
          <p className={`text-lg font-bold ${conf.text}`}>{rec.confidenceLabel}</p>
          <div className="w-20 h-1.5 bg-white/60 rounded-full overflow-hidden mt-1.5">
            <motion.div
              className={`h-full ${conf.bar} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${rec.confidenceValue}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <p className="text-xs opacity-60 mt-1">{rec.confidenceValue}%</p>
        </div>
      </div>

      {rec.confidenceValue < 60 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Low confidence:</strong> Add more evidence to improve accuracy.
          </p>
          <button
            onClick={() => onNavigate('evidence')}
            className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 flex-shrink-0"
          >
            Add evidence
          </button>
        </div>
      )}

      {/* Share cards */}
      <div className={`grid grid-cols-1 gap-4 ${participants.length === 2 ? 'md:grid-cols-2' : participants.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {rec.shares.map((share, i) => {
          const p = getParticipant(share.participantId);
          const isLower = share.adjustment < 0;
          const isHigher = share.adjustment > 0;
          const isPayer = share.participantId === payer.id;

          return (
            <motion.div
              key={share.participantId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${p.borderClass}`}
            >
              <div className={`${p.lightBg} ${p.borderClass} border-b px-5 py-4 flex items-center gap-3`}>
                <div className={`w-11 h-11 ${p.bgClass} rounded-full flex items-center justify-center text-white font-bold text-base`}>
                  {p.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-base">{p.name}</span>
                    <span className="text-lg">{p.emoji}</span>
                  </div>
                  <p className="text-xs text-slate-500">{p.role}</p>
                </div>
              </div>

              <div className="px-5 py-5 text-center">
                <div className="text-4xl font-bold text-slate-900 mb-2">€{share.fairShare}</div>
                <div className={`flex items-center justify-center gap-1.5 text-sm font-semibold mb-1 ${
                  isLower ? 'text-emerald-600' : isHigher ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {isLower ? (
                    <><TrendingDown className="w-4 h-4" /> €{Math.abs(share.adjustment)} less than equal split</>
                  ) : isHigher ? (
                    <><TrendingUp className="w-4 h-4" /> €{share.adjustment} more than equal split</>
                  ) : (
                    <><Minus className="w-4 h-4" /> Same as equal split</>
                  )}
                </div>
                <p className="text-xs text-slate-400">Equal split was €{share.equalShare}</p>
              </div>

              <div className="px-5 pb-5">
                <div className="bg-slate-50 rounded-xl p-3">
                  {isPayer ? (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Paid upfront</p>
                      <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                        Receives back €{Math.round(billTotal - share.fairShare)}
                      </p>
                    </div>
                  ) : share.alreadyPaid > 0 ? (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Already paid €{share.alreadyPaid}</p>
                      <p className="text-sm font-semibold text-amber-700 mt-0.5">
                        Owes {payer.name} €{share.amountOwedToPayer} more
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Not yet paid</p>
                      <p className="text-sm font-semibold text-red-600 mt-0.5">
                        Owes {payer.name} €{share.amountOwedToPayer}
                      </p>
                    </div>
                  )}
                </div>

                {share.reasoning && share.reasoning.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {share.reasoning.slice(0, 3).map((r, ri) => (
                      <p key={ri} className="text-xs text-slate-500 flex items-start gap-1.5">
                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                        {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Equal Split vs. FairSplit</h2>
          <p className="text-xs text-slate-400 mt-0.5">Same bill, different fairness</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Participant</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Equal Split</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wider">FairSplit</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rec.shares.map((share, i) => {
                const p = getParticipant(share.participantId);
                return (
                  <tr key={share.participantId} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 ${p.bgClass} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                          {p.name[0]}
                        </div>
                        <span className="font-medium text-slate-700">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3.5 text-sm text-slate-500">€{share.equalShare}</td>
                    <td className="text-center px-4 py-3.5 text-sm font-bold text-slate-800">€{share.fairShare}</td>
                    <td className="text-center px-5 py-3.5">
                      <span className={`text-sm font-bold ${share.adjustment < 0 ? 'text-emerald-600' : share.adjustment > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {share.adjustment > 0 ? '+' : ''}{share.adjustment !== 0 ? `€${Math.abs(share.adjustment)}` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          AI Mediator Reasoning
        </h2>
        <div className="space-y-3">
          {rec.overallReasoning.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{reason}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Settlement */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Settlement Summary</h2>
        <div className="space-y-2.5">
          {rec.settlement.map((line, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
              </div>
              <p className="text-sm text-slate-700">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Regenerate with Claude AI
        </button>

        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('payment')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Accept & create payment requests
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('challenge')}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Challenge
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('evidence')}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Add more evidence
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('payment')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Generate payment requests
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

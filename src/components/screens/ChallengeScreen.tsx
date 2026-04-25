import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import { Screen, ChallengeMessage, RecommendationResult, AnalyzedEvidence, DisputeSetup } from '../../types';
import { streamChallengeResponse } from '../../utils/claudeApi';

const GENERIC_CHALLENGE_ARGUMENTS = [
  'I was away for part of the billing period',
  'Fixed costs should count more than usage-based costs',
  'We had a prior agreement that should influence this split',
  'I already paid enough toward this bill',
];

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  apiKey: string;
  recommendation: RecommendationResult | null;
  analyzedEvidence: AnalyzedEvidence[];
}

export default function ChallengeScreen({ setup, onNavigate, apiKey, recommendation, analyzedEvidence }: Props) {
  const { participants } = setup;
  const [messages, setMessages] = useState<ChallengeMessage[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState(participants[0]?.id ?? '');
  const [customInput, setCustomInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentParticipant = participants.find(p => p.id === selectedParticipant) ?? participants[0];

  const fallbackRecommendation: RecommendationResult = {
    shares: participants.map((p, i) => {
      const equalShare = Math.round(setup.billTotal / participants.length);
      return {
        participantId: p.id,
        equalShare,
        fairShare: equalShare,
        adjustment: 0,
        amountOwedToPayer: i === 0 ? 0 : equalShare - p.paidAmount,
        alreadyPaid: p.paidAmount,
        stillOwes: i === 0 ? -(setup.billTotal - equalShare) : Math.max(0, equalShare - p.paidAmount),
        reasoning: [],
      };
    }),
    confidenceLabel: 'Medium',
    confidenceValue: 50,
    overallReasoning: [],
    settlement: [],
  };

  const submitChallenge = async (text: string, participantId: string) => {
    if (!text.trim() || isStreaming) return;

    const participant = participants.find(p => p.id === participantId) ?? participants[0];
    setMessages(prev => [...prev, { role: 'user', participantId, content: text }]);
    setCustomInput('');
    setIsStreaming(true);

    setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    try {
      let fullText = '';
      await streamChallengeResponse(
        apiKey,
        text,
        participant.name,
        recommendation ?? fallbackRecommendation,
        analyzedEvidence,
        (token) => {
          fullText += token;
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'ai') {
              updated[lastIdx] = { ...updated[lastIdx], content: fullText, isStreaming: true };
            }
            return updated;
          });
        },
      );

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
        }
        return updated;
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], content: `Error: ${errMsg}`, isStreaming: false };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider bg-violet-50 px-2.5 py-1 rounded-full">
          Challenge Mode
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Challenge Recommendation</h1>
        <p className="text-slate-500 mt-1">Submit arguments live to Claude AI. Get real reasoning back.</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          Arguments are sent to Claude in real-time. The mediator will assess their impact and stream a response.
        </p>
      </div>

      {/* Current amounts */}
      {recommendation && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current suggestion</p>
          <div className="flex gap-3 flex-wrap">
            {recommendation.shares.map(share => {
              const p = participants.find(pt => pt.id === share.participantId) ?? participants[0];
              return (
                <div
                  key={share.participantId}
                  className={`flex-1 min-w-[80px] text-center py-3 rounded-xl ${p.lightBg} border ${p.borderClass}`}
                >
                  <p className={`text-xs font-semibold ${p.textClass}`}>{p.name}</p>
                  <p className={`text-xl font-bold ${p.textClass} mt-0.5`}>€{share.fairShare}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Argument panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select participant</p>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedParticipant(p.id)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedParticipant === p.id
                      ? `${p.bgClass} text-white shadow-sm`
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pre-set arguments for {currentParticipant?.name}
            </p>
            {GENERIC_CHALLENGE_ARGUMENTS.map((argument, i) => (
              <motion.button
                key={i}
                whileHover={!isStreaming ? { scale: 1.01 } : {}}
                whileTap={!isStreaming ? { scale: 0.98 } : {}}
                onClick={() => submitChallenge(argument, selectedParticipant)}
                disabled={isStreaming}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                  isStreaming
                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-wait'
                    : `${currentParticipant?.lightBg} ${currentParticipant?.borderClass} ${currentParticipant?.textClass} hover:shadow-sm cursor-pointer font-medium`
                }`}
              >
                <span className="mr-1 opacity-60">"</span>
                {argument}
                <span className="ml-1 opacity-60">"</span>
              </motion.button>
            ))}
          </div>

          {/* Custom input */}
          <div className="p-4 pt-0">
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-2 font-medium">Or type a custom argument:</p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !isStreaming) {
                      submitChallenge(customInput, selectedParticipant);
                    }
                  }}
                  placeholder={`${currentParticipant?.name}'s argument…`}
                  disabled={isStreaming}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                />
                <motion.button
                  whileHover={!isStreaming && customInput.trim() ? { scale: 1.05 } : {}}
                  whileTap={!isStreaming && customInput.trim() ? { scale: 0.95 } : {}}
                  onClick={() => submitChallenge(customInput, selectedParticipant)}
                  disabled={isStreaming || !customInput.trim()}
                  className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${
                    isStreaming || !customInput.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : `${currentParticipant?.bgClass} text-white hover:opacity-90 cursor-pointer`
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ minHeight: '400px' }}>
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">FairSplit Mediator</p>
              <p className="text-xs text-slate-400">
                {isStreaming ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                    Streaming response…
                  </span>
                ) : 'Claude AI · Non-binding'}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                <Bot className="w-8 h-8 mb-2" />
                <p className="text-xs text-center">Select a participant and submit<br />an argument to begin</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => {
                const p = msg.participantId ? participants.find(pt => pt.id === msg.participantId) : null;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'ai' ? (
                      <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    ) : p ? (
                      <div className={`w-7 h-7 ${p.bgClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                        {p.name[0]}
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'ai'
                          ? 'bg-slate-50 border border-slate-100 text-slate-700'
                          : `${p?.lightBg || 'bg-violet-50'} border ${p?.borderClass || 'border-violet-100'} ${p?.textClass || 'text-violet-700'}`
                      }`}
                    >
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-0.5 h-3.5 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('recommendation')}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recommendation
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('payment')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center gap-2"
        >
          Accept & proceed to payment
        </motion.button>
      </div>
    </motion.div>
  );
}

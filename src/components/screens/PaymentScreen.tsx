import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Send, Copy, BookMarked, CheckCircle, ArrowRight } from 'lucide-react';
import { Screen, RecommendationResult, DisputeSetup, Participant } from '../../types';

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  recommendation: RecommendationResult | null;
}

interface PaymentRequest {
  id: string;
  from: Participant;
  to: Participant;
  amount: number;
  description: string;
  note: string;
}

export default function PaymentScreen({ setup, onNavigate, recommendation }: Props) {
  const { participants, billTotal, title, period } = setup;

  // The payer is whoever paid the most (or the full bill)
  const payer = participants.reduce((max, p) => p.paidAmount > max.paidAmount ? p : max, participants[0]);
  const nonPayers = participants.filter(p => p.id !== payer.id);

  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (id: string) => setSentRequests(prev => new Set([...prev, id]));
  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getShare = (participantId: string) =>
    recommendation?.shares.find(s => s.participantId === participantId);

  const requests: PaymentRequest[] = nonPayers
    .map(p => {
      const share = getShare(p.id);
      const fairShare = share?.fairShare ?? Math.round(billTotal / participants.length);
      const alreadyPaid = p.paidAmount;
      const stillOwes = Math.max(0, fairShare - alreadyPaid);

      if (stillOwes <= 0) return null;

      return {
        id: `${p.id}-to-${payer.id}`,
        from: p,
        to: payer,
        amount: stillOwes,
        description: `${title || 'Shared expense'}${period ? ` (${period})` : ''} — FairSplit recommendation`,
        note: alreadyPaid > 0
          ? `Fair share: €${fairShare}. Already paid €${alreadyPaid}. Remaining balance: €${stillOwes}.`
          : `Fair share: €${fairShare}. Nothing paid yet.`,
      };
    })
    .filter((r): r is PaymentRequest => r !== null);

  const payerShare = getShare(payer.id);
  const payerFairShare = payerShare?.fairShare ?? Math.round(billTotal / participants.length);
  const payerReceivesBack = billTotal - payerFairShare;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
          Step 6 of 6
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Payment Requests</h1>
        <p className="text-slate-500 mt-1">Generate bunq-style payment requests with embedded reasoning.</p>
      </div>

      {/* Settlement summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Settlement Summary</h2>
        <div className={`grid grid-cols-1 gap-3 ${participants.length <= 3 ? `md:grid-cols-${participants.length + 1}` : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Payer card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <div className={`w-10 h-10 ${payer.bgClass} rounded-full flex items-center justify-center text-white font-bold text-base mx-auto mb-2`}>
              {payer.name[0]}
            </div>
            <p className="text-xs font-semibold text-emerald-600 mb-1">{payer.name} paid</p>
            <p className="text-2xl font-bold text-emerald-700">€{payer.paidAmount}</p>
            <p className="text-xs text-slate-500 mt-1">
              {recommendation ? `Receives back €${Math.round(payerReceivesBack)}` : 'Upfront'}
            </p>
          </div>

          {/* Non-payer cards */}
          {nonPayers.map(p => {
            const share = getShare(p.id);
            const fairShare = share?.fairShare ?? Math.round(billTotal / participants.length);
            const stillOwes = Math.max(0, fairShare - p.paidAmount);
            const color = stillOwes > 0 ? 'red' : 'emerald';

            return (
              <div key={p.id} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-center`}>
                <div className={`w-10 h-10 ${p.bgClass} rounded-full flex items-center justify-center text-white font-bold text-base mx-auto mb-2`}>
                  {p.name[0]}
                </div>
                <p className={`text-xs font-semibold text-${color}-600 mb-1`}>
                  {stillOwes > 0 ? `${p.name} owes ${payer.name}` : `${p.name} settled`}
                </p>
                <p className={`text-2xl font-bold text-${color}-700`}>€{stillOwes}</p>
                {p.paidAmount > 0 && (
                  <p className="text-xs text-slate-500 mt-1">Already paid €{p.paidAmount} of €{fairShare}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment request cards */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req, i) => {
            const isSent = sentRequests.has(req.id);
            const isCopied = copiedId === req.id;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isSent ? 'border-emerald-200' : 'border-slate-100'
                }`}
              >
                <div className={`px-5 py-3 border-b ${isSent ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} flex items-center gap-3`}>
                  <CreditCard className={`w-4 h-4 ${isSent ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className={`text-sm font-semibold ${isSent ? 'text-emerald-700' : 'text-slate-700'}`}>
                    bunq Payment Request
                  </span>
                  {isSent && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Sent
                    </motion.span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 ${req.from.bgClass} rounded-full flex items-center justify-center text-white font-bold`}>
                        {req.from.name[0]}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">From</p>
                        <p className="font-semibold text-slate-800">{req.from.name}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 ${req.to.bgClass} rounded-full flex items-center justify-center text-white font-bold`}>
                        {req.to.name[0]}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">To</p>
                        <p className="font-semibold text-slate-800">{req.to.name}</p>
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400">Amount</p>
                      <p className="text-3xl font-bold text-slate-900">€{req.amount}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 mb-4">
                    <p className="font-medium text-slate-700 text-sm mb-1">{req.description}</p>
                    <p className="text-xs text-slate-500">{req.note}</p>
                  </div>

                  <div className="flex gap-2.5 flex-wrap">
                    <motion.button
                      whileHover={!isSent ? { scale: 1.02 } : {}}
                      whileTap={!isSent ? { scale: 0.97 } : {}}
                      onClick={() => handleSend(req.id)}
                      disabled={isSent}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isSent ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      {isSent ? 'Request sent' : 'Send payment request'}
                    </motion.button>
                    <button
                      onClick={() => handleCopy(req.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      {isCopied ? 'Copied!' : 'Copy explanation'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all">
                      <BookMarked className="w-4 h-4" />
                      Save as house rule
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-emerald-800 text-lg mb-1">All settled!</p>
          <p className="text-sm text-emerald-600">Everyone has already paid their fair share. No transfers needed.</p>
        </div>
      )}

      {sentRequests.size > 0 && requests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center"
        >
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-emerald-800 text-lg mb-1">
            Dispute resolved with evidence-backed payment requests.
          </p>
          <p className="text-sm text-emerald-600">
            {sentRequests.size} of {requests.length} payment request{sentRequests.size !== 1 ? 's' : ''} sent.
          </p>
        </motion.div>
      )}

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('pitch')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2.5"
        >
          View impact summary
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

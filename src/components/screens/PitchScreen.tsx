import { motion } from 'framer-motion';
import { Trophy, CreditCard, Users, FileSearch, BookMarked, ArrowRight, Scale, TrendingUp, Zap, ShieldCheck, RotateCcw } from 'lucide-react';
import { AnalyzedEvidence, DisputeSetup, RecommendationResult, Screen } from '../../types';

interface Props {
  setup: DisputeSetup;
  recommendation: RecommendationResult | null;
  onNavigate: (screen: Screen) => void;
  analyzedEvidence: AnalyzedEvidence[];
  onReset: () => void;
}

const VALUE_PROPS = [
  {
    icon: CreditCard,
    color: 'bg-emerald-500',
    title: 'Converts disputes into payment requests',
    desc: 'Every FairSplit resolution generates bunq payment requests with embedded reasoning, context, and automatic amounts.',
  },
  {
    icon: Users,
    color: 'bg-violet-500',
    title: 'Invites new users into bunq',
    desc: 'Settlement links encourage non-bunq participants to join bunq to receive or send payment. Built-in organic growth.',
  },
  {
    icon: TrendingUp,
    color: 'bg-blue-500',
    title: 'Increases engagement with shared accounts',
    desc: 'Groups using FairSplit naturally migrate to shared bunq pots and group accounts for future expense management.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-teal-500',
    title: 'Adds trusted payment context',
    desc: 'Payment requests include evidence summaries and AI reasoning, reducing confusion, back-and-forth, and support tickets.',
  },
  {
    icon: BookMarked,
    color: 'bg-amber-500',
    title: 'Creates reusable house rules',
    desc: 'Accepted recommendations can be saved as household rules for future disputes, reducing friction over time.',
  },
  {
    icon: Zap,
    color: 'bg-pink-500',
    title: 'Multimodal AI as a real product differentiator',
    desc: 'No competitor offers evidence-based fair splitting. Bills, chats, tickets, voice notes analyzed together by AI.',
  },
];

export default function PitchScreen({ setup, recommendation, onNavigate, analyzedEvidence, onReset }: Props) {
  const evidenceCount = analyzedEvidence.filter(e => e.status === 'done').length;
  const paymentRequestCount = recommendation?.shares.filter(share => share.amountOwedToPayer > 0).length ?? 0;

  const metrics = [
    { icon: CreditCard, value: String(paymentRequestCount), label: 'Payment requests generated', color: 'emerald' },
    { icon: Users, value: String(setup.participants.length), label: 'Participants engaged', color: 'violet' },
    { icon: FileSearch, value: String(evidenceCount), label: 'Evidence items analyzed', color: 'blue' },
    { icon: BookMarked, value: recommendation ? 'Ready' : 'Pending', label: 'Rule capture status', color: 'amber' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Trophy className="w-9 h-9 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Dispute Resolved</h1>
        <p className="text-emerald-100 text-lg mb-4">
          Evidence-backed payment requests sent. No more confusion.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-200">
          <Scale className="w-4 h-4" />
          <span>Non-binding recommendation · All participants informed</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Dispute Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(({ icon: Icon, value, label, color }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className={`bg-white rounded-2xl border border-${color}-100 shadow-sm p-5 text-center`}
            >
              <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <p className={`text-3xl font-bold text-${color}-600 mb-1`}>{value}</p>
              <p className="text-xs text-slate-500 leading-tight">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Value for bunq</h2>
        <p className="text-slate-500 text-sm mb-5">Why FairSplit makes bunq the only app you need for shared expenses.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VALUE_PROPS.map(({ icon: Icon, color, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4"
            >
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-900 text-white rounded-3xl p-8 text-center"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Scale className="w-7 h-7 text-white" />
        </div>
        <p className="text-lg text-slate-100 leading-relaxed max-w-2xl mx-auto mb-6 italic">
          "bunq FairSplit turns messy shared expense disputes into fair, evidence-backed settlement
          recommendations. By analyzing bills, chats, calendars, tickets, payment history, and voice
          explanations, it moves beyond equal splitting and helps groups resolve money conflicts while
          generating bunq payment requests and reusable shared-expense rules."
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Multimodal AI', 'Evidence-based', 'Non-binding', 'bunq-native'].map(tag => (
            <span key={tag} className="bg-white/10 border border-white/20 text-white text-sm px-3.5 py-1.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Measurable impact for bunq</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { metric: 'Payment requests per dispute', value: paymentRequestCount > 0 ? `${paymentRequestCount} ready` : 'Pending recommendation', trend: '↑' },
            { metric: 'Participants in current dispute', value: String(setup.participants.length), trend: '↑' },
            { metric: 'Evidence items analyzed', value: String(evidenceCount), trend: '↑' },
            { metric: 'Challenge and mediation support', value: 'Available in-flow', trend: '↑' },
            { metric: 'Support ticket reduction', value: '~40% fewer', trend: '↓ cost' },
          ].map(({ metric, value, trend }) => (
            <div key={metric} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-sm text-slate-600">{metric}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{value}</span>
                <span className="text-xs text-emerald-600 font-bold">{trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start another dispute
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('payment')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Back to payments
        </motion.button>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { Scale, FileText, Plane, MessageSquare, Mic, CreditCard, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Screen } from '../../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

const FLOATING_CARDS = [
  { icon: FileText, label: 'Bill', value: 'Invoice or utilities PDF', color: 'bg-blue-500', pos: 'top-16 left-12', delay: 0 },
  { icon: Plane, label: 'Travel Ticket', value: 'Presence and absence evidence', color: 'bg-purple-500', pos: 'top-24 right-16', delay: 0.15 },
  { icon: MessageSquare, label: 'Chat Screenshot', value: 'Prior agreements and disputes', color: 'bg-amber-500', pos: 'bottom-32 left-16', delay: 0.3 },
  { icon: Mic, label: 'Voice Note', value: 'Participant explanation', color: 'bg-pink-500', pos: 'bottom-24 right-12', delay: 0.2 },
  { icon: Calendar, label: 'Calendar', value: 'Dates and availability', color: 'bg-green-500', pos: 'top-1/2 left-6', delay: 0.1 },
  { icon: CreditCard, label: 'Payment', value: 'Who already paid what', color: 'bg-teal-500', pos: 'top-1/2 right-8', delay: 0.25 },
];

export default function LandingScreen({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {FLOATING_CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay + 0.5, duration: 0.6 }}
            className={`absolute ${card.pos} hidden lg:block pointer-events-none`}
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-xs">{card.label}</span>
              </div>
              <p className="text-white/60 text-xs">{card.value}</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-white/40 text-xs">AI</span>
              </div>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-3xl px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-2xl leading-tight">bunq FairSplit</div>
            <div className="text-emerald-400 text-sm font-medium">AI Expense Mediator</div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
        >
          Fair shared expenses,
          <br />
          <span className="text-emerald-400">powered by multimodal AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white/70 text-xl mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Upload bills, chats, tickets, receipts, calendars, and voice notes.
          FairSplit turns messy evidence into a non-binding fair split recommendation
          and bunq-style payment requests.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {[
            { label: 'Bills & PDFs', icon: '📄' },
            { label: 'Travel Tickets', icon: '✈️' },
            { label: 'Chat Screenshots', icon: '💬' },
            { label: 'Voice Notes', icon: '🎤' },
            { label: 'Calendars', icon: '📅' },
            { label: 'Payment History', icon: '💳' },
          ].map(pill => (
            <span
              key={pill.label}
              className="bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium"
            >
              {pill.icon} {pill.label}
            </span>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate('setup')}
          className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-lg px-10 py-4 rounded-2xl transition-colors inline-flex items-center gap-3 shadow-lg shadow-emerald-400/30"
        >
          Start dispute
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 flex items-center gap-6 text-white/40 text-xs"
      >
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Non-binding recommendation
        </span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <span>Evidence-based analysis</span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <span>Privacy-first</span>
      </motion.div>
    </div>
  );
}

import { ReactNode } from 'react';
import { DisputeSetup, Screen } from '../types';
import {
  Scale,
  Settings,
  FileSearch,
  CalendarDays,
  BarChart3,
  Star,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

interface Props {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
  setup: DisputeSetup | null;
}

const STEPS = [
  { step: 1, label: 'Setup', screen: 'setup' as Screen, icon: Settings },
  { step: 2, label: 'Evidence', screen: 'evidence' as Screen, icon: FileSearch },
  { step: 3, label: 'Timeline', screen: 'timeline' as Screen, icon: CalendarDays },
  { step: 4, label: 'Cost Model', screen: 'costmodel' as Screen, icon: BarChart3 },
  { step: 5, label: 'Recommendation', screen: 'recommendation' as Screen, icon: Star },
  { step: 6, label: 'Settlement', screen: 'payment' as Screen, icon: CreditCard },
];

const SCREEN_TO_STEP: Record<Screen, number> = {
  landing: 0,
  setup: 1,
  evidence: 2,
  timeline: 3,
  costmodel: 4,
  recommendation: 5,
  challenge: 5,
  payment: 6,
  pitch: 7,
};

export default function Layout({ currentScreen, onNavigate, children, setup }: Props) {
  const currentStep = SCREEN_TO_STEP[currentScreen];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-100">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">bunq FairSplit</div>
              <div className="text-xs text-slate-400 leading-tight">AI Expense Mediator</div>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Dispute Flow
          </p>
          {STEPS.map(({ step, label, screen, icon: Icon }) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;
            const isUpcoming = currentStep < step;

            return (
              <button
                key={step}
                onClick={() => isCompleted && onNavigate(screen)}
                disabled={isUpcoming}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isCurrent ? 'bg-emerald-50 text-emerald-700' : ''}
                  ${isCompleted ? 'text-slate-600 hover:bg-slate-50 cursor-pointer' : ''}
                  ${isUpcoming ? 'text-slate-300 cursor-not-allowed' : ''}
                `}
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isCurrent ? 'bg-emerald-500 text-white' : ''}
                    ${isCompleted ? 'bg-emerald-100 text-emerald-600' : ''}
                    ${isUpcoming ? 'bg-slate-100 text-slate-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {isCurrent && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Active Dispute
            </p>
            {setup ? (
              <>
                <p className="font-semibold text-slate-800 text-sm truncate">{setup.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  EUR {setup.billTotal} · {setup.participants.length} participant{setup.participants.length !== 1 ? 's' : ''}
                  {setup.period ? ` · ${setup.period}` : ''}
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {setup.participants.map(participant => (
                    <span
                      key={participant.id}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${participant.lightBg} ${participant.textClass}`}
                    >
                      {participant.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-800 text-sm">No active dispute</p>
                <p className="text-xs text-slate-500 mt-0.5">Create a dispute to begin.</p>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Non-binding · Evidence-based recommendation
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

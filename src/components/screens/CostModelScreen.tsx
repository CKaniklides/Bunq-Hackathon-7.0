import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Users } from 'lucide-react';
import { Screen, RecommendationResult, DisputeSetup, CostComponent } from '../../types';

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  recommendation: RecommendationResult | null;
}

function createPlaceholderComponents(setup: DisputeSetup): CostComponent[] {
  const equalShare = Math.round((setup.billTotal / setup.participants.length) * 100) / 100;

  return [
    {
      id: 'unclassified',
      name: 'Unclassified Total',
      amount: setup.billTotal,
      splitLogic: 'Provisional equal split until AI recommendation is generated',
      explanation:
        'This placeholder view shows the full bill split equally. Generate a recommendation to see an evidence-based cost decomposition.',
      colorBar: 'bg-blue-500',
      colorBg: 'bg-blue-50',
      colorText: 'text-blue-700',
      examples: ['Full bill total'],
      perPerson: Object.fromEntries(setup.participants.map(participant => [participant.id, equalShare])),
    },
  ];
}

export default function CostModelScreen({ setup, onNavigate, recommendation }: Props) {
  const { participants } = setup;
  const components = recommendation?.costComponents ?? createPlaceholderComponents(setup);
  const totalAmount = components.reduce((sum, component) => sum + component.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
          Step 4 of 6
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Cost Model</h1>
        <p className="text-slate-500 mt-1">
          {recommendation?.isAIGenerated
            ? `AI-generated decomposition of the EUR ${totalAmount} bill into cost categories.`
            : `Generate a recommendation to replace this provisional equal split with an evidence-based cost model.`}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            EUR {totalAmount} Bill Breakdown
          </h2>
          <span className="text-sm font-bold text-slate-700">Total: EUR {totalAmount}</span>
        </div>

        <div className="flex h-10 rounded-xl overflow-hidden gap-1 mb-4">
          {components.map((component, index) => (
            <motion.div
              key={component.id}
              className={`${component.colorBar} flex items-center justify-center text-white text-xs font-bold`}
              initial={{ flex: 0 }}
              animate={{ flex: component.amount }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: 'easeOut' }}
              title={`${component.name}: EUR ${component.amount}`}
            >
              {component.amount > 50 ? `EUR ${component.amount}` : ''}
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          {components.map(component => (
            <div key={component.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${component.colorBar} rounded-sm`} />
              <span className="text-xs text-slate-600 font-medium">{component.name}</span>
              <span className="text-xs text-slate-400">EUR {component.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {components.map((component, index) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.15, duration: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className={`${component.colorBg} px-5 py-4 border-b border-slate-100/50`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{component.name}</h3>
                  <p className={`text-xs font-semibold ${component.colorText} mt-0.5`}>
                    {component.splitLogic}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${component.colorText}`}>EUR {component.amount}</div>
                  <div className="text-xs text-slate-400">
                    {Math.round((component.amount / totalAmount) * 100)}% of total
                  </div>
                </div>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden mt-2">
                <motion.div
                  className={`h-full ${component.colorBar} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(component.amount / totalAmount) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + index * 0.2 }}
                />
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {component.explanation}
                </p>
                {component.examples.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {component.examples.map(example => (
                      <span key={example} className={`text-xs px-2.5 py-1 rounded-full ${component.colorBg} ${component.colorText} font-medium border border-white`}>
                        {example}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Per participant
                </p>
                <div className="space-y-2">
                  {participants.map(participant => {
                    const amount = component.perPerson[participant.id] ?? 0;
                    const maxAmount = Math.max(...Object.values(component.perPerson));
                    return (
                      <div key={participant.id} className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${participant.bgClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {participant.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-600">{participant.name}</span>
                            <span className="text-xs font-bold text-slate-700">EUR {amount}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${component.colorBar} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: maxAmount > 0 ? `${(amount / maxAmount) * 100}%` : '0%' }}
                              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 + index * 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Full Breakdown Per Person</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Participant</th>
                {components.map(component => (
                  <th key={component.id} className={`text-center px-4 py-3 text-xs font-semibold ${component.colorText} uppercase tracking-wider`}>
                    {component.name.split(' ')[0]}
                  </th>
                ))}
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => {
                const amounts = components.map(component => component.perPerson[participant.id] ?? 0);
                const total = amounts.reduce((sum, amount) => sum + amount, 0);
                return (
                  <tr key={participant.id} className={index % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 ${participant.bgClass} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                          {participant.name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 text-sm">{participant.name}</span>
                          <span className="text-base ml-1">{participant.emoji}</span>
                        </div>
                      </div>
                    </td>
                    {amounts.map((amount, amountIndex) => (
                      <td key={amountIndex} className={`text-center px-4 py-3.5 text-sm font-medium ${components[amountIndex]?.colorText}`}>
                        EUR {amount}
                      </td>
                    ))}
                    <td className="text-center px-5 py-3.5">
                      <span className="font-bold text-slate-800 text-base">EUR {total}</span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-bold">
                <td className="px-5 py-3 text-sm text-slate-600">Total</td>
                {components.map(component => (
                  <td key={component.id} className={`text-center px-4 py-3 text-sm ${component.colorText}`}>EUR {component.amount}</td>
                ))}
                <td className="text-center px-5 py-3 text-base text-slate-800">EUR {totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('recommendation')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2.5 shadow-sm"
        >
          View Recommendation
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Trash2, Euro, Calendar, Tag, Users, Zap } from 'lucide-react';
import { Screen, DisputeSetup } from '../../types';
import { createParticipant } from '../../data/mockData';

interface Props {
  onSetupComplete: (setup: DisputeSetup) => void;
  onNavigate: (screen: Screen) => void;
}

interface ParticipantRow {
  key: string;
  name: string;
  paidAmount: string;
}

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

export default function SetupScreen({ onSetupComplete }: Props) {
  const [title, setTitle] = useState('');
  const [billTotal, setBillTotal] = useState('');
  const [period, setPeriod] = useState('');
  const [rows, setRows] = useState<ParticipantRow[]>([
    { key: makeKey(), name: '', paidAmount: '' },
    { key: makeKey(), name: '', paidAmount: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addRow = () =>
    setRows(prev => [...prev, { key: makeKey(), name: '', paidAmount: '' }]);

  const removeRow = (key: string) =>
    setRows(prev => prev.filter(r => r.key !== key));

  const updateRow = (key: string, field: 'name' | 'paidAmount', value: string) =>
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));

  const totalPaid = rows.reduce((s, r) => s + (parseFloat(r.paidAmount) || 0), 0);
  const bill = parseFloat(billTotal) || 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Required';
    if (!bill || bill <= 0) errs.bill = 'Enter a valid amount';
    const named = rows.filter(r => r.name.trim());
    if (named.length < 2) errs.participants = 'At least 2 participants required';
    const names = named.map(r => r.name.trim().toLowerCase());
    if (new Set(names).size < names.length) errs.participants = 'Participant names must be unique';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const named = rows.filter(r => r.name.trim());
    const participants = named.map((r, i) =>
      createParticipant(r.name.trim(), parseFloat(r.paidAmount) || 0, i)
    );
    onSetupComplete({
      title: title.trim(),
      period: period.trim(),
      billTotal: bill,
      participants,
    });
  };

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
          Step 1 of 6
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Dispute Setup</h1>
        <p className="text-slate-500 mt-1">Enter the shared expense details and add all participants.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-500" />
            Expense Details
          </h2>

          {/* Bill title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              Bill title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
              placeholder="e.g. March utilities, Restaurant dinner, Airbnb"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Bill total */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Euro className="w-3 h-3" />
              Total bill amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billTotal}
                onChange={e => { setBillTotal(e.target.value); setErrors(p => ({ ...p, bill: '' })); }}
                placeholder="0.00"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  errors.bill ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.bill && <p className="text-xs text-red-500 mt-1">{errors.bill}</p>}
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Billing period <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="e.g. March 2024, Q1 2025, Last weekend"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Running summary */}
          {bill > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-100 rounded-xl p-3.5"
            >
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Equal split (before FairSplit)</p>
              <p className="text-sm text-amber-800">
                {rows.filter(r => r.name.trim()).length > 0
                  ? `€${(bill / rows.filter(r => r.name.trim()).length).toFixed(2)} each · ${rows.filter(r => r.name.trim()).length} participants`
                  : `€${bill} total`}
              </p>
              {totalPaid > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {totalPaid >= bill
                    ? `€${totalPaid.toFixed(2)} already paid — fully covered`
                    : `€${totalPaid.toFixed(2)} paid so far — €${(bill - totalPaid).toFixed(2)} outstanding`}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-emerald-500" />
            Participants
          </h2>

          {errors.participants && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-red-600">{errors.participants}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {rows.map((row, i) => {
                const colorClass = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500'][i % 6];
                return (
                  <motion.div
                    key={row.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {row.name ? row.name[0].toUpperCase() : (i + 1)}
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => updateRow(row.key, 'name', e.target.value)}
                      placeholder={`Person ${i + 1} name`}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />

                    {/* Paid amount */}
                    <div className="relative w-28 flex-shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.paidAmount}
                        onChange={e => updateRow(row.key, 'paidAmount', e.target.value)}
                        placeholder="paid"
                        className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      />
                    </div>

                    {/* Remove */}
                    {rows.length > 2 && (
                      <button
                        onClick={() => removeRow(row.key)}
                        className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-slate-400 flex-1">Amount already paid toward this bill (0 if not yet paid)</p>
          </div>

          <button
            onClick={addRow}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add participant
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900 mb-1">How FairSplit works</h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Upload evidence — bills, calendars, travel tickets, chats, voice notes — and Claude AI analyzes
              them to produce a fair, explainable recommendation. You can challenge any part of it.
            </p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Non-binding · Evidence-based · Fully private (no server, API calls direct from your browser)
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2.5 shadow-sm"
        >
          Start Dispute
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

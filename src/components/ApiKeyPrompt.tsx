import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowLeft, Eye, EyeOff, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  onSetKey: (key: string) => void;
  onBack: () => void;
}

export default function ApiKeyPrompt({ onSetKey, onBack }: Props) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key should start with sk-ant-. Check your Anthropic console.');
      return;
    }
    onSetKey(trimmed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Key className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">API Key Required</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            FairSplit uses Claude AI to analyze evidence and generate recommendations.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => { setValue(e.target.value); setError(''); }}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-600 mt-1.5">{error}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!value.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Start FairSplit
            </motion.button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-3 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Your key is stored only in sessionStorage and never sent to any server other than Anthropic's API directly from your browser.</span>
            </div>
            <a
              href="https://console.anthropic.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Get a free API key at console.anthropic.com
            </a>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to landing
          </button>
        </div>
      </motion.div>
    </div>
  );
}

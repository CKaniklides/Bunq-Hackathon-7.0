import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Upload, Sparkles, Loader2, X, Mic, MessageSquareText, Mail, NotebookPen } from 'lucide-react';
import { Screen, AnalyzedEvidence, EvidenceType, DisputeSetup } from '../../types';
import { analyzeFile, analyzeTextEvidence } from '../../utils/claudeApi';
import EvidenceCard from '../EvidenceCard';

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  apiKey: string;
  analyzedEvidence: AnalyzedEvidence[];
  onEvidenceAdd: (ev: AnalyzedEvidence) => void;
}

interface PendingItem {
  id: string;
  participantId: string;
  type: EvidenceType;
  label: string;
}

interface TextEvidenceDraft {
  participantId: string;
  type: EvidenceType;
  title: string;
  text: string;
}

const FILE_EVIDENCE_TYPES: EvidenceType[] = [
  'bill',
  'receipt',
  'ticket',
  'calendar',
  'chat',
  'voice',
  'payment',
  'email',
  'note',
];

const TEXT_EVIDENCE_TYPES: EvidenceType[] = [
  'voice',
  'chat',
  'email',
  'calendar',
  'payment',
  'note',
  'receipt',
  'ticket',
  'bill',
];

function getEvidenceTypeLabel(type: EvidenceType) {
  switch (type) {
    case 'bill':
      return 'Utility Bill';
    case 'receipt':
      return 'Receipt';
    case 'ticket':
      return 'Travel Ticket';
    case 'calendar':
      return 'Calendar';
    case 'chat':
      return 'Chat';
    case 'voice':
      return 'Voice Explanation';
    case 'payment':
      return 'Payment Record';
    case 'email':
      return 'Email';
    case 'note':
      return 'Written Note';
    default:
      return type;
  }
}

function getTextPlaceholder(type: EvidenceType, participantName: string) {
  switch (type) {
    case 'voice':
      return `Paste ${participantName}'s voice explanation or transcript here.\n\nExample:\nI was away from March 6 to March 20, so I should not pay an equal share of the variable usage.`;
    case 'chat':
      return 'Paste the relevant chat messages here, including who said what and any dates or agreements.';
    case 'email':
      return 'Paste the email or email thread here, including sender, recipients, subject, and relevant body text.';
    case 'calendar':
      return 'Paste the calendar summary here, including dates away, events, and where the participant was.';
    case 'payment':
      return 'Paste the payment confirmation details here, including amount, sender, recipient, date, and reference.';
    case 'note':
      return 'Paste the written explanation, statement, or summary here.';
    case 'receipt':
      return 'Paste the receipt details here, including merchant, date, amount, and items if relevant.';
    case 'ticket':
      return 'Paste the travel ticket or booking details here, including dates, origin, destination, and traveler.';
    case 'bill':
      return 'Paste the bill details here, including amount, provider, billing period, and category.';
    default:
      return 'Paste the evidence text here.';
  }
}

export default function EvidenceScreen({ setup, onNavigate, apiKey, analyzedEvidence, onEvidenceAdd }: Props) {
  const { participants } = setup;
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploadTypePrompt, setUploadTypePrompt] = useState<{ participantId: string; file: File } | null>(null);
  const [textEvidencePrompt, setTextEvidencePrompt] = useState<TextEvidenceDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputParticipant, setFileInputParticipant] = useState<string>('');

  const sharedEvidence = analyzedEvidence.filter(e => e.participantId === 'shared');
  const totalDone = analyzedEvidence.filter(e => e.status === 'done').length;

  const handleFile = useCallback(async (file: File, participantId: string, evidenceType: EvidenceType) => {
    const pendingId = `${participantId}-${evidenceType}-upload-${Date.now()}`;
    const pending: PendingItem = { id: pendingId, participantId, type: evidenceType, label: file.name };
    setPendingItems(prev => [...prev, pending]);

    try {
      const participant = participants.find(p => p.id === participantId)!;
      const result = await analyzeFile(apiKey, file, evidenceType, participantId, participant.name);
      onEvidenceAdd(result);
    } catch (err) {
      const errorEv: AnalyzedEvidence = {
        id: pendingId,
        participantId,
        type: evidenceType,
        status: 'error',
        title: file.name,
        subtitle: '',
        extractedFacts: [],
        confidence: 0,
        confidenceLabel: 'Low',
        structuredData: {},
        error: err instanceof Error ? err.message : 'Upload failed',
      };
      onEvidenceAdd(errorEv);
    } finally {
      setPendingItems(prev => prev.filter(p => p.id !== pendingId));
    }
  }, [apiKey, onEvidenceAdd, participants]);

  const handleTextEvidence = useCallback(async (draft: TextEvidenceDraft) => {
    const trimmedText = draft.text.trim();
    if (!trimmedText) return;

    const pendingId = `${draft.participantId}-${draft.type}-text-${Date.now()}`;
    const pending: PendingItem = {
      id: pendingId,
      participantId: draft.participantId,
      type: draft.type,
      label: draft.title.trim() || getEvidenceTypeLabel(draft.type),
    };
    setPendingItems(prev => [...prev, pending]);

    try {
      const participant = participants.find(p => p.id === draft.participantId)!;
      const result = await analyzeTextEvidence(
        apiKey,
        trimmedText,
        draft.type,
        draft.participantId,
        participant.name,
        draft.title.trim() || undefined,
      );
      onEvidenceAdd(result);
    } catch (err) {
      const errorEv: AnalyzedEvidence = {
        id: pendingId,
        participantId: draft.participantId,
        type: draft.type,
        status: 'error',
        title: draft.title.trim() || getEvidenceTypeLabel(draft.type),
        subtitle: '',
        extractedFacts: [],
        confidence: 0,
        confidenceLabel: 'Low',
        structuredData: {},
        error: err instanceof Error ? err.message : 'Analysis failed',
      };
      onEvidenceAdd(errorEv);
    } finally {
      setPendingItems(prev => prev.filter(p => p.id !== pendingId));
    }
  }, [apiKey, onEvidenceAdd, participants]);

  const handleDrop = (e: React.DragEvent, participantId: string) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setUploadTypePrompt({ participantId, file });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileInputParticipant) return;
    setUploadTypePrompt({ participantId: fileInputParticipant, file });
    e.target.value = '';
  };

  const handleUploadTypeSelect = (type: EvidenceType) => {
    if (!uploadTypePrompt) return;
    handleFile(uploadTypePrompt.file, uploadTypePrompt.participantId, type);
    setUploadTypePrompt(null);
  };

  const triggerFileInput = (participantId: string) => {
    setFileInputParticipant(participantId);
    fileInputRef.current?.click();
  };

  const openTextEvidenceModal = (participantId: string) => {
    setTextEvidencePrompt({
      participantId,
      type: 'voice',
      title: '',
      text: '',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,text/markdown,text/csv,message/rfc822,application/json,.txt,.md,.csv,.eml,.json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <AnimatePresence>
        {uploadTypePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setUploadTypePrompt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">What type of evidence?</h3>
                <button onClick={() => setUploadTypePrompt(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 truncate">File: {uploadTypePrompt.file.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {FILE_EVIDENCE_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleUploadTypeSelect(type)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                  >
                    {getEvidenceTypeLabel(type)}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {textEvidencePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setTextEvidencePrompt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Add voice or text evidence</h3>
                <button onClick={() => setTextEvidencePrompt(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Evidence type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TEXT_EVIDENCE_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setTextEvidencePrompt(prev => prev ? { ...prev, type } : prev)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                          textEvidencePrompt.type === type
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {getEvidenceTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={textEvidencePrompt.title}
                    onChange={e => setTextEvidencePrompt(prev => prev ? { ...prev, title: e.target.value } : prev)}
                    placeholder={`${getEvidenceTypeLabel(textEvidencePrompt.type)} title`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Content
                  </label>
                  <textarea
                    value={textEvidencePrompt.text}
                    onChange={e => setTextEvidencePrompt(prev => prev ? { ...prev, text: e.target.value } : prev)}
                    placeholder={getTextPlaceholder(
                      textEvidencePrompt.type,
                      participants.find(p => p.id === textEvidencePrompt.participantId)?.name || 'participant',
                    )}
                    rows={10}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setTextEvidencePrompt(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const draft = textEvidencePrompt;
                      if (!draft || !draft.text.trim()) return;
                      setTextEvidencePrompt(null);
                      await handleTextEvidence(draft);
                    }}
                    disabled={!textEvidencePrompt.text.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-all"
                  >
                    Analyze evidence
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
            Step 2 of 6
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Evidence Upload</h1>
          <p className="text-slate-500 mt-1">
            Upload files, paste transcripts, and add written context for Claude to analyze.
            {setup.title && <span className="font-medium text-slate-700"> · {setup.title}</span>}
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">{totalDone}</p>
          <p className="text-xs text-slate-500">items analyzed</p>
        </div>
      </div>

      {sharedEvidence.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 flex items-center gap-2 border-b border-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-800 text-sm">Shared Dispute Evidence</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {sharedEvidence.map(ev => (
              <EvidenceCard key={ev.id} evidence={ev} />
            ))}
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 ${participants.length === 2 ? 'md:grid-cols-2' : participants.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {participants.map(participant => {
          const pEvidence = analyzedEvidence.filter(e => e.participantId === participant.id);
          const pPending = pendingItems.filter(p => p.participantId === participant.id);
          const isDragTarget = dragOver === participant.id;

          return (
            <div key={participant.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className={`${participant.lightBg} ${participant.borderClass} border-b px-4 py-3.5`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${participant.bgClass} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {participant.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{participant.name}</span>
                      <span className="text-base">{participant.emoji}</span>
                    </div>
                    <p className="text-xs text-slate-500">{participant.role}</p>
                  </div>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${participant.textClass} ${participant.lightBg} border ${participant.borderClass}`}>
                    {pEvidence.filter(e => e.status === 'done').length} items
                  </span>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-3 min-h-[80px]">
                <AnimatePresence mode="popLayout">
                  {pEvidence.map(ev => (
                    <EvidenceCard key={ev.id} evidence={ev} />
                  ))}
                  {pPending.map(p => (
                    <EvidenceCard
                      key={p.id}
                      evidence={{
                        id: p.id,
                        participantId: p.participantId,
                        type: p.type,
                        status: 'analyzing',
                        title: p.label,
                        subtitle: 'Analyzing with Claude AI...',
                        extractedFacts: [],
                        confidence: 0,
                        confidenceLabel: 'Low',
                        structuredData: {},
                      }}
                    />
                  ))}
                </AnimatePresence>
                {pEvidence.length === 0 && pPending.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-16 text-slate-300">
                    <p className="text-xs font-medium">No evidence added yet</p>
                  </div>
                )}
              </div>

              <div className="p-3 pt-0 space-y-2">
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOver(participant.id);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, participant.id)}
                  onClick={() => triggerFileInput(participant.id)}
                  className={`border-2 border-dashed rounded-xl px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-all text-xs font-medium ${
                    isDragTarget
                      ? `${participant.borderClass} ${participant.lightBg} ${participant.textClass}`
                      : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{isDragTarget ? 'Drop to analyze' : 'Drop file or click to upload'}</span>
                  <span className="ml-auto text-slate-300">JPG / PNG / PDF / TXT</span>
                </div>

                <button
                  onClick={() => openTextEvidenceModal(participant.id)}
                  className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 text-xs font-medium transition-all flex items-center gap-2.5"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-500" />
                  <span className="flex-1 text-left">Add voice or text evidence</span>
                  <span className="text-slate-400">Transcript / chat / email</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Mic className="w-4 h-4 text-pink-500 flex-shrink-0" />
          <p className="text-xs text-slate-600">
            Add a <strong>voice explanation</strong> by pasting a transcript or written statement from each participant.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <MessageSquareText className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-slate-600">
            Paste <strong>chat excerpts</strong>, timeline notes, or payment details if you do not have a screenshot.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Mail className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <NotebookPen className="w-4 h-4 text-slate-500 flex-shrink-0 -ml-2" />
          <p className="text-xs text-slate-600">
            Add <strong>emails</strong> and <strong>written notes</strong> to support agreements, explanations, and context.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Tip:</strong> This flow now supports both file-based and text-based evidence, including bills, receipts, calendars, travel tickets, chat logs, voice explanations, payment records, emails, and written notes.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{totalDone}</span> evidence items analyzed
          {pendingItems.length > 0 && (
            <span className="ml-2 text-violet-600">
              <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
              {pendingItems.length} analyzing...
            </span>
          )}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('timeline')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2.5 shadow-sm"
        >
          Continue to Timeline
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Upload, Sparkles, Loader2, X } from 'lucide-react';
import { Screen, AnalyzedEvidence, EvidenceType, DisputeSetup } from '../../types';
import { analyzeFile } from '../../utils/claudeApi';
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

export default function EvidenceScreen({ setup, onNavigate, apiKey, analyzedEvidence, onEvidenceAdd }: Props) {
  const { participants } = setup;
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploadTypePrompt, setUploadTypePrompt] = useState<{ participantId: string; file: File } | null>(null);
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
        accept="image/jpeg,image/png,image/webp,application/pdf"
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
                <h3 className="font-bold text-slate-800">What type of document?</h3>
                <button onClick={() => setUploadTypePrompt(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 truncate">File: {uploadTypePrompt.file.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['bill', 'ticket', 'calendar', 'chat', 'voice', 'payment'] as EvidenceType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleUploadTypeSelect(type)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all capitalize text-left"
                  >
                    {type === 'bill' ? 'Utility Bill' :
                     type === 'ticket' ? 'Flight Ticket' :
                     type === 'calendar' ? 'Calendar' :
                     type === 'chat' ? 'Chat Screenshot' :
                     type === 'voice' ? 'Voice Note' : 'Payment Record'}
                  </button>
                ))}
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
            Upload evidence and let Claude analyze each item.
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
                        subtitle: 'Analyzing with Claude AI…',
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
                  onDragOver={e => { e.preventDefault(); setDragOver(participant.id); }}
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
                  <span className="ml-auto text-slate-300">JPG · PNG · PDF</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Tip:</strong> Upload bills, receipts, calendars, travel tickets, chat screenshots, voice note transcripts, or payment records.
          Claude AI extracts facts from each piece of evidence.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{totalDone}</span> evidence items analyzed
          {pendingItems.length > 0 && (
            <span className="ml-2 text-violet-600">
              <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
              {pendingItems.length} analyzing…
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

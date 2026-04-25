export type Screen =
  | 'landing'
  | 'setup'
  | 'evidence'
  | 'timeline'
  | 'costmodel'
  | 'recommendation'
  | 'challenge'
  | 'payment'
  | 'pitch';

export interface Participant {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  lightBg: string;
  role: string;
  hasPaid: boolean;
  paidAmount: number;
  emoji: string;
}

export type EvidenceType = 'bill' | 'receipt' | 'chat' | 'calendar' | 'ticket' | 'voice' | 'payment';

export interface Evidence {
  id: string;
  participantId: string;
  type: EvidenceType;
  title: string;
  subtitle: string;
  dateRange?: { start: string; end: string };
  extractedFacts: string[];
  confidence: number;
  confidenceLabel: string;
}

export interface CostComponent {
  id: string;
  name: string;
  amount: number;
  splitLogic: string;
  explanation: string;
  colorBar: string;
  colorBg: string;
  colorText: string;
  examples: string[];
  perPerson: Record<string, number>;
}

export interface ParticipantShare {
  participantId: string;
  equalShare: number;
  fairShare: number;
  adjustment: number;
  amountOwedToPayer: number;
  alreadyPaid: number;
  stillOwes: number;
  reasoning: string[];
}

export interface RecommendationResult {
  shares: ParticipantShare[];
  costComponents?: CostComponent[];
  confidenceLabel: string;
  confidenceValue: number;
  overallReasoning: string[];
  settlement: string[];
  isAIGenerated?: boolean;
}

export interface ChallengeMessage {
  role: 'user' | 'ai';
  participantId?: string;
  content: string;
  isStreaming?: boolean;
}

export interface ChatMessage {
  sender: string;
  message: string;
  color: string;
}

// ── Dispute setup ─────────────────────────────────────────────────────────────

export interface DisputeSetup {
  title: string;
  period: string;
  billTotal: number;
  participants: Participant[];
}

// ── Real AI analysis types ────────────────────────────────────────────────────

export type EvidenceStatus = 'idle' | 'analyzing' | 'done' | 'error';

export interface AnalyzedEvidence {
  id: string;
  participantId: string;
  type: EvidenceType;
  status: EvidenceStatus;
  title: string;
  subtitle: string;
  extractedFacts: string[];
  confidence: number;
  confidenceLabel: string;
  dateRange?: { start: string; end: string };
  structuredData: Record<string, unknown>;
  error?: string;
  fileName?: string;
  filePreviewUrl?: string;
}

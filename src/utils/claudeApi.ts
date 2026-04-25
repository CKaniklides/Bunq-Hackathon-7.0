import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzedEvidence, EvidenceType, RecommendationResult, CostComponent, ParticipantShare, DisputeSetup } from '../types';

const MODEL = 'claude-sonnet-4-6';

function makeClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
}

function isPDF(file: File) {
  return file.type === 'application/pdf';
}

function confidenceLabel(value: number): string {
  if (value >= 90) return 'Very High';
  if (value >= 75) return 'High';
  if (value >= 60) return 'Medium-High';
  if (value >= 40) return 'Medium';
  return 'Low';
}

// ── Tool schemas ──────────────────────────────────────────────────────────────

const BILL_TOOL = {
  name: 'analyze_bill',
  description: 'Extract structured information from a utility bill or invoice image/document.',
  input_schema: {
    type: 'object' as const,
    properties: {
      totalAmount: { type: 'number', description: 'Total amount due in euros' },
      currency: { type: 'string' },
      periodStart: { type: 'string', description: 'Billing period start, e.g. "March 1, 2024"' },
      periodEnd: { type: 'string', description: 'Billing period end' },
      category: { type: 'string', description: 'e.g. Electricity & Gas, Water, Internet' },
      provider: { type: 'string', description: 'Utility company name' },
      accountHolder: { type: 'string' },
      extractedFacts: { type: 'array', items: { type: 'string' }, description: '4-5 key facts from the document' },
      confidence: { type: 'number', description: 'Confidence 0–100 that this is a valid bill and data is accurate' },
    },
    required: ['totalAmount', 'extractedFacts', 'confidence'],
  },
};

const TICKET_TOOL = {
  name: 'analyze_ticket',
  description: 'Extract information from a flight ticket, boarding pass, or travel confirmation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      passengerName: { type: 'string' },
      departureDate: { type: 'string', description: 'e.g. "March 6, 2024"' },
      departureCity: { type: 'string' },
      returnDate: { type: 'string', description: 'null if one-way' },
      returnCity: { type: 'string' },
      airline: { type: 'string' },
      daysAbsent: { type: 'number', description: 'Total days away from home base (inclusive)' },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const CALENDAR_TOOL = {
  name: 'analyze_calendar',
  description: 'Extract absence and presence information from a calendar screenshot or export.',
  input_schema: {
    type: 'object' as const,
    properties: {
      person: { type: 'string' },
      absencePeriods: {
        type: 'array',
        items: {
          type: 'object',
          properties: { start: { type: 'string' }, end: { type: 'string' }, reason: { type: 'string' } },
          required: ['start', 'end'],
        },
      },
      totalDaysAbsent: { type: 'number' },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const CHAT_TOOL = {
  name: 'analyze_chat',
  description: 'Analyze a chat screenshot or conversation log for expense-related content.',
  input_schema: {
    type: 'object' as const,
    properties: {
      participants: { type: 'array', items: { type: 'string' } },
      keyMessages: {
        type: 'array',
        items: {
          type: 'object',
          properties: { sender: { type: 'string' }, text: { type: 'string' } },
          required: ['sender', 'text'],
        },
        description: 'Most relevant messages (up to 5)',
      },
      agreements: { type: 'array', items: { type: 'string' }, description: 'Any expense agreements or habits mentioned' },
      disputes: { type: 'array', items: { type: 'string' }, description: 'Contested claims' },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const VOICE_TOOL = {
  name: 'analyze_voice_note',
  description: 'Extract claims and arguments from a voice note transcript.',
  input_schema: {
    type: 'object' as const,
    properties: {
      speaker: { type: 'string' },
      mainClaim: { type: 'string', description: 'Core argument being made' },
      supportingPoints: { type: 'array', items: { type: 'string' } },
      evidenceReferenced: { type: 'array', items: { type: 'string' } },
      sentiment: { type: 'string', enum: ['cooperative', 'neutral', 'contentious'] },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const PAYMENT_TOOL = {
  name: 'analyze_payment',
  description: 'Extract information from a payment confirmation, bank statement, or transfer record.',
  input_schema: {
    type: 'object' as const,
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
      date: { type: 'string' },
      senderName: { type: 'string' },
      recipientName: { type: 'string' },
      reference: { type: 'string' },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const TOOL_MAP: Record<EvidenceType, { name: string; description: string; input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] } }> = {
  bill: BILL_TOOL,
  receipt: BILL_TOOL,
  ticket: TICKET_TOOL,
  calendar: CALENDAR_TOOL,
  chat: CHAT_TOOL,
  voice: VOICE_TOOL,
  payment: PAYMENT_TOOL,
};

const TYPE_PROMPT: Record<EvidenceType, string> = {
  bill: 'This is a utility bill or invoice. Extract all financial and billing details.',
  receipt: 'This is a receipt or invoice. Extract amount, date, vendor, and items.',
  ticket: 'This is a flight ticket or travel confirmation. Extract travel dates, passenger name, and origin/destination.',
  calendar: 'This is a calendar screenshot. Extract absence periods, events, and any relevant dates.',
  chat: 'This is a chat conversation screenshot. Extract messages about the shared expense dispute.',
  voice: 'This is a transcript of a voice note about a shared expense. Extract claims and arguments.',
  payment: 'This is a payment confirmation or bank record. Extract amount, date, sender, and recipient.',
};

// ── Evidence analysis ─────────────────────────────────────────────────────────

function buildTitleFromType(type: EvidenceType, data: Record<string, unknown>, participantName: string): { title: string; subtitle: string; dateRange?: { start: string; end: string } } {
  switch (type) {
    case 'bill':
    case 'receipt': {
      const amount = data.totalAmount ? `€${data.totalAmount}` : '';
      const cat = (data.category as string) || 'Utility';
      return {
        title: `${cat} Bill${amount ? ` — ${amount}` : ''}`,
        subtitle: `${data.provider || 'Provider'} · ${data.periodStart || ''}–${data.periodEnd || ''}`,
        dateRange: data.periodStart ? { start: data.periodStart as string, end: data.periodEnd as string } : undefined,
      };
    }
    case 'ticket': {
      const depart = data.departureDate as string || '';
      const ret = data.returnDate as string || '';
      return {
        title: `Flight Ticket — ${data.airline || 'Airline'}`,
        subtitle: `${data.passengerName || participantName} · ${depart}${ret ? ` → ${ret}` : ''}`,
        dateRange: depart ? { start: depart, end: ret || depart } : undefined,
      };
    }
    case 'calendar':
      return {
        title: `Calendar — ${participantName}`,
        subtitle: `${data.totalDaysAbsent ? `${data.totalDaysAbsent} days absent` : 'Presence record'}`,
      };
    case 'chat':
      return {
        title: `Group Chat Screenshot`,
        subtitle: `${data.participants ? (data.participants as string[]).join(', ') : 'Participants'} · Expense discussion`,
      };
    case 'voice':
      return {
        title: `Voice Note — ${participantName}`,
        subtitle: `Spoken statement about expense dispute`,
      };
    case 'payment':
      return {
        title: `Payment Confirmation`,
        subtitle: `${data.senderName || participantName} → ${data.recipientName || '?'} · ${data.date || ''}`,
      };
    default:
      return { title: type, subtitle: participantName };
  }
}

async function callAnalysisTool(
  client: Anthropic,
  content: Anthropic.MessageParam['content'],
  evidenceType: EvidenceType,
): Promise<Record<string, unknown>> {
  const tool = TOOL_MAP[evidenceType];
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are a precise evidence analyst for a shared expense mediator. Extract only what is clearly visible or stated. If uncertain, express it with lower confidence.',
    tools: [tool as Anthropic.Tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content }],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  if (!toolUse) throw new Error('No tool response from Claude');
  return toolUse.input as Record<string, unknown>;
}

export async function analyzeFile(
  apiKey: string,
  file: File,
  evidenceType: EvidenceType,
  participantId: string,
  participantName: string,
): Promise<AnalyzedEvidence> {
  const client = makeClient(apiKey);
  const id = `${participantId}-${evidenceType}-${Date.now()}`;

  let content: Anthropic.MessageParam['content'];

  if (isImage(file)) {
    const b64 = await fileToBase64(file);
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
      { type: 'text', text: TYPE_PROMPT[evidenceType] },
    ];
  } else if (isPDF(file)) {
    const b64 = await fileToBase64(file);
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } } as unknown as Anthropic.TextBlockParam,
      { type: 'text', text: TYPE_PROMPT[evidenceType] },
    ];
  } else {
    throw new Error(`Unsupported file type: ${file.type}. Use images (JPG/PNG/WebP) or PDFs.`);
  }

  const data = await callAnalysisTool(client, content, evidenceType);
  const { title, subtitle, dateRange } = buildTitleFromType(evidenceType, data, participantName);
  const facts = (data.extractedFacts as string[]) || [];
  const conf = Math.round((data.confidence as number) ?? 70);

  let previewUrl: string | undefined;
  if (isImage(file)) previewUrl = URL.createObjectURL(file);

  return {
    id,
    participantId,
    type: evidenceType,
    status: 'done',
    title,
    subtitle,
    extractedFacts: facts,
    confidence: conf,
    confidenceLabel: confidenceLabel(conf),
    dateRange,
    structuredData: data,
    fileName: file.name,
    filePreviewUrl: previewUrl,
  };
}

// ── Fair split recommendation ─────────────────────────────────────────────────

function buildRecommendationTool(participantIds: string[]) {
  const perPersonProps = Object.fromEntries(participantIds.map(id => [id, { type: 'number' }]));
  return {
    name: 'generate_fair_split',
    description: 'Generate a fair expense split recommendation based on all submitted evidence.',
    input_schema: {
      type: 'object' as const,
      properties: {
        costComponents: {
          type: 'array',
          description: 'Decompose the total bill into cost categories (aim for 2-4: e.g. Fixed, Baseline, Variable)',
          items: {
            type: 'object',
            required: ['name', 'amount', 'explanation', 'splitLogic', 'perPerson'],
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              explanation: { type: 'string' },
              splitLogic: { type: 'string', description: 'e.g. "Equal split", "Weighted by presence"' },
              examples: { type: 'array', items: { type: 'string' } },
              perPerson: {
                type: 'object',
                description: `Amount per participant. Keys: ${participantIds.join(', ')}`,
                properties: perPersonProps,
                required: participantIds,
              },
            },
          },
        },
        shares: {
          type: 'array',
          description: 'Final fair share per participant',
          items: {
            type: 'object',
            required: ['participantId', 'fairShare', 'reasoning'],
            properties: {
              participantId: { type: 'string', enum: participantIds },
              fairShare: { type: 'number', description: 'Recommended fair share in euros' },
              reasoning: { type: 'array', items: { type: 'string' }, description: '3-4 bullet points' },
            },
          },
        },
        overallReasoning: {
          type: 'array',
          items: { type: 'string' },
          description: '4-6 points summarizing the overall reasoning',
        },
        settlement: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step settlement instructions accounting for what has already been paid',
        },
        confidenceLabel: { type: 'string', enum: ['Low', 'Medium', 'Medium-high', 'High'] },
        confidenceValue: { type: 'number', description: '0–100 confidence score' },
      },
      required: ['costComponents', 'shares', 'overallReasoning', 'settlement', 'confidenceLabel', 'confidenceValue'],
    },
  };
}

const COST_COLORS: Record<number, { colorBar: string; colorBg: string; colorText: string }> = {
  0: { colorBar: 'bg-blue-500', colorBg: 'bg-blue-50', colorText: 'text-blue-700' },
  1: { colorBar: 'bg-purple-500', colorBg: 'bg-purple-50', colorText: 'text-purple-700' },
  2: { colorBar: 'bg-teal-500', colorBg: 'bg-teal-50', colorText: 'text-teal-700' },
  3: { colorBar: 'bg-amber-500', colorBg: 'bg-amber-50', colorText: 'text-amber-700' },
};

export async function generateRecommendation(
  apiKey: string,
  evidence: AnalyzedEvidence[],
  setup: DisputeSetup,
): Promise<RecommendationResult> {
  const client = makeClient(apiKey);
  const { billTotal, participants, title, period } = setup;
  const participantIds = participants.map(p => p.id);

  // Find the primary payer (person who paid the most)
  const payer = participants.reduce((max, p) => p.paidAmount > max.paidAmount ? p : max);

  const paymentHistory = participants
    .map(p => {
      if (p.paidAmount >= billTotal) return `- ${p.name} (id: ${p.id}) paid the FULL €${p.paidAmount} bill upfront`;
      if (p.paidAmount > 0) return `- ${p.name} (id: ${p.id}) has already paid €${p.paidAmount} toward this bill`;
      return `- ${p.name} (id: ${p.id}) has paid €0 so far`;
    })
    .join('\n');

  const evidenceSummary = evidence
    .filter(e => e.status === 'done')
    .map(e => {
      const owner = participants.find(p => p.id === e.participantId)?.name ?? e.participantId;
      return `[${e.type.toUpperCase()}] submitted by ${owner}\n  Title: ${e.title}\n  Facts: ${e.extractedFacts.join(' | ')}\n  Confidence: ${e.confidence}%`;
    })
    .join('\n\n');

  const prompt = `Shared expense dispute:
Title: "${title}"
${period ? `Period: ${period}` : ''}
Total bill: €${billTotal}
Participants (${participants.length}): ${participants.map(p => p.name).join(', ')}

Payment history:
${paymentHistory}

Evidence submitted (${evidence.filter(e => e.status === 'done').length} items):
${evidenceSummary || 'No evidence submitted yet — base recommendation only.'}

Generate a fair split recommendation. Analyze the bill into logical cost categories based on the evidence type (utilities: suggest Fixed/Baseline/Variable; meal: could be just usage-based; trip: per-night stays, shared activities, etc.).

Weight costs by evidence of presence, usage, or absence. Be transparent when evidence is limited.

IMPORTANT: Use the exact participantId values: ${participantIds.map(id => `"${id}"`).join(', ')}.
The fair shares MUST sum to exactly €${billTotal}.
The primary payer is ${payer.name} (id: "${payer.id}") who paid €${payer.paidAmount} upfront.`;

  const tool = buildRecommendationTool(participantIds);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are FairSplit, a neutral AI expense mediator. Your recommendations are non-binding and evidence-based.
Key principles:
- Always explain your reasoning clearly
- Acknowledge uncertainty when evidence is missing
- Be fair to all parties
- The fair shares MUST sum to exactly €${billTotal}`,
    tools: [tool as unknown as Anthropic.Tool],
    tool_choice: { type: 'tool', name: 'generate_fair_split' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  if (!toolUse) throw new Error('No recommendation from Claude');

  type RawData = {
    costComponents: Array<{
      name: string; amount: number; explanation: string; splitLogic: string;
      examples?: string[]; perPerson: Record<string, number>;
    }>;
    shares: Array<{ participantId: string; fairShare: number; reasoning: string[] }>;
    overallReasoning: string[];
    settlement: string[];
    confidenceLabel: string;
    confidenceValue: number;
  };

  const raw = toolUse.input as RawData;
  const EQUAL = billTotal / participants.length;
  const PAID: Record<string, number> = Object.fromEntries(participants.map(p => [p.id, p.paidAmount]));

  const costComponents: CostComponent[] = raw.costComponents.map((c, i) => ({
    id: c.name.toLowerCase().replace(/\s+/g, '-'),
    name: c.name,
    amount: c.amount,
    splitLogic: c.splitLogic,
    explanation: c.explanation,
    examples: c.examples || [],
    perPerson: c.perPerson,
    ...(COST_COLORS[i] ?? COST_COLORS[2]),
  }));

  const shares: ParticipantShare[] = raw.shares.map(s => {
    const alreadyPaid = PAID[s.participantId] ?? 0;
    const isPayer = s.participantId === payer.id;
    const adjustment = Math.round(s.fairShare - EQUAL);
    const amountOwedToPayer = isPayer ? 0 : Math.max(0, s.fairShare - alreadyPaid);
    const stillOwes = isPayer ? -(billTotal - s.fairShare) : amountOwedToPayer;
    return {
      participantId: s.participantId,
      equalShare: Math.round(EQUAL),
      fairShare: s.fairShare,
      adjustment,
      amountOwedToPayer,
      alreadyPaid,
      stillOwes,
      reasoning: s.reasoning,
    };
  });

  return {
    shares,
    costComponents,
    confidenceLabel: raw.confidenceLabel,
    confidenceValue: raw.confidenceValue,
    overallReasoning: raw.overallReasoning,
    settlement: raw.settlement,
    isAIGenerated: true,
  };
}

// ── Challenge response (streaming) ───────────────────────────────────────────

export async function streamChallengeResponse(
  apiKey: string,
  challengeText: string,
  participantName: string,
  recommendation: RecommendationResult,
  evidence: AnalyzedEvidence[],
  onToken: (token: string) => void,
): Promise<void> {
  const client = makeClient(apiKey);

  const recSummary = recommendation.shares
    .map(s => `${s.participantId}: €${s.fairShare} (${s.adjustment >= 0 ? '+' : ''}${s.adjustment} from equal split)`)
    .join(', ');

  const evidenceSummary = evidence
    .filter(e => e.status === 'done')
    .map(e => `${e.type}: ${e.title} (${e.confidence}% confidence)`)
    .join('; ');

  const prompt = `CURRENT RECOMMENDATION: ${recSummary}
CONFIDENCE: ${recommendation.confidenceLabel}

EVIDENCE ON FILE: ${evidenceSummary || 'Limited evidence'}

CHALLENGE from ${participantName}:
"${challengeText}"

Respond as a fair mediator in 3-4 sentences. Acknowledge the argument, state what evidence would strengthen or weaken it, and whether the recommendation should change based on what's currently available. Be constructive and neutral.`;

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 512,
    system: 'You are FairSplit, a neutral AI expense mediator. Be concise, fair, and constructive. Do not use legal language. Your responses are non-binding.',
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onToken(event.delta.text);
    }
  }
}

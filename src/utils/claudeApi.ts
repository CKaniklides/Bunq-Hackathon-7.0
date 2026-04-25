import Anthropic from '@anthropic-ai/sdk';
import type {
  AnalyzedEvidence,
  CostComponent,
  DisputeSetup,
  EvidenceType,
  ParticipantShare,
  RecommendationResult,
} from '../types';

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

async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function isImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
}

function isPDF(file: File) {
  return file.type === 'application/pdf';
}

function isTextFile(file: File) {
  const textMimeTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'message/rfc822',
    'application/json',
  ];
  const fileName = file.name.toLowerCase();

  return (
    textMimeTypes.includes(file.type) ||
    ['.txt', '.md', '.csv', '.eml', '.json'].some(extension => fileName.endsWith(extension))
  );
}

function confidenceLabel(value: number): string {
  if (value >= 90) return 'Very High';
  if (value >= 75) return 'High';
  if (value >= 60) return 'Medium-High';
  if (value >= 40) return 'Medium';
  return 'Low';
}

const BILL_TOOL = {
  name: 'analyze_bill',
  description: 'Extract structured information from a utility bill or invoice image, PDF, or text summary.',
  input_schema: {
    type: 'object' as const,
    properties: {
      totalAmount: { type: 'number', description: 'Total amount due in euros' },
      currency: { type: 'string' },
      periodStart: { type: 'string', description: 'Billing period start, for example "March 1, 2024"' },
      periodEnd: { type: 'string', description: 'Billing period end' },
      category: { type: 'string', description: 'For example Electricity, Water, Internet' },
      provider: { type: 'string', description: 'Provider or merchant name' },
      accountHolder: { type: 'string' },
      extractedFacts: { type: 'array', items: { type: 'string' }, description: '4-5 key facts' },
      confidence: { type: 'number', description: 'Confidence from 0 to 100' },
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
      departureDate: { type: 'string' },
      departureCity: { type: 'string' },
      returnDate: { type: 'string' },
      returnCity: { type: 'string' },
      airline: { type: 'string' },
      daysAbsent: { type: 'number', description: 'Total days away from the shared home, inclusive where possible' },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const CALENDAR_TOOL = {
  name: 'analyze_calendar',
  description: 'Extract absence and presence information from a calendar screenshot, export, or written summary.',
  input_schema: {
    type: 'object' as const,
    properties: {
      person: { type: 'string' },
      absencePeriods: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            reason: { type: 'string' },
          },
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
  description: 'Analyze a chat screenshot or pasted conversation log for expense-related content.',
  input_schema: {
    type: 'object' as const,
    properties: {
      participants: { type: 'array', items: { type: 'string' } },
      keyMessages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sender: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['sender', 'text'],
        },
        description: 'Most relevant messages, up to five',
      },
      agreements: { type: 'array', items: { type: 'string' } },
      disputes: { type: 'array', items: { type: 'string' } },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const VOICE_TOOL = {
  name: 'analyze_voice_note',
  description: 'Extract claims and arguments from a voice note transcript or written voice explanation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      speaker: { type: 'string' },
      mainClaim: { type: 'string' },
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
  description: 'Extract information from a payment confirmation, bank statement, transfer record, or pasted payment details.',
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

const EMAIL_TOOL = {
  name: 'analyze_email',
  description: 'Extract structured information from an email or email thread about the shared expense dispute.',
  input_schema: {
    type: 'object' as const,
    properties: {
      sender: { type: 'string' },
      recipients: { type: 'array', items: { type: 'string' } },
      subject: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      agreements: { type: 'array', items: { type: 'string' } },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const NOTE_TOOL = {
  name: 'analyze_note',
  description: 'Extract claims, dates, and important facts from a written note, explanation, or summary.',
  input_schema: {
    type: 'object' as const,
    properties: {
      author: { type: 'string' },
      summary: { type: 'string' },
      claims: { type: 'array', items: { type: 'string' } },
      datesMentioned: { type: 'array', items: { type: 'string' } },
      extractedFacts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
    },
    required: ['extractedFacts', 'confidence'],
  },
};

const TOOL_MAP: Record<
  EvidenceType,
  {
    name: string;
    description: string;
    input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
  }
> = {
  bill: BILL_TOOL,
  receipt: BILL_TOOL,
  ticket: TICKET_TOOL,
  calendar: CALENDAR_TOOL,
  chat: CHAT_TOOL,
  voice: VOICE_TOOL,
  payment: PAYMENT_TOOL,
  email: EMAIL_TOOL,
  note: NOTE_TOOL,
};

const TYPE_PROMPT: Record<EvidenceType, string> = {
  bill: 'This is a utility bill or invoice. Extract all financial and billing details.',
  receipt: 'This is a receipt or invoice. Extract amount, date, vendor, and items.',
  ticket: 'This is a flight ticket or travel confirmation. Extract travel dates, passenger name, and origin or destination.',
  calendar: 'This is a calendar record. Extract absence periods, events, and relevant dates.',
  chat: 'This is a chat conversation about the shared expense dispute. Extract the most relevant messages and agreements.',
  voice: 'This is a voice explanation or transcript about a shared expense. Extract claims and supporting arguments.',
  payment: 'This is a payment confirmation or bank record. Extract amount, date, sender, and recipient.',
  email: 'This is an email or email thread about the shared expense dispute. Extract agreements, dates, and key facts.',
  note: 'This is a written explanation or note about the shared expense dispute. Extract claims, dates, and key facts.',
};

function buildTitleFromType(
  type: EvidenceType,
  data: Record<string, unknown>,
  participantName: string,
): { title: string; subtitle: string; dateRange?: { start: string; end: string } } {
  switch (type) {
    case 'bill':
    case 'receipt': {
      const amount = data.totalAmount ? `EUR ${data.totalAmount}` : '';
      const category = (data.category as string) || 'Bill';
      return {
        title: `${category}${amount ? ` - ${amount}` : ''}`,
        subtitle: `${data.provider || 'Provider'} · ${data.periodStart || ''}${data.periodEnd ? ` to ${data.periodEnd}` : ''}`,
        dateRange:
          typeof data.periodStart === 'string'
            ? { start: data.periodStart as string, end: (data.periodEnd as string) || (data.periodStart as string) }
            : undefined,
      };
    }
    case 'ticket': {
      const departure = (data.departureDate as string) || '';
      const returnDate = (data.returnDate as string) || '';
      return {
        title: `Travel Ticket - ${data.airline || 'Carrier'}`,
        subtitle: `${data.passengerName || participantName} · ${departure}${returnDate ? ` to ${returnDate}` : ''}`,
        dateRange: departure ? { start: departure, end: returnDate || departure } : undefined,
      };
    }
    case 'calendar':
      return {
        title: `Calendar - ${participantName}`,
        subtitle: `${data.totalDaysAbsent ? `${data.totalDaysAbsent} days absent` : 'Presence record'}`,
      };
    case 'chat':
      return {
        title: 'Chat Evidence',
        subtitle: `${data.participants ? (data.participants as string[]).join(', ') : participantName} · Conversation summary`,
      };
    case 'voice':
      return {
        title: `Voice Explanation - ${participantName}`,
        subtitle: 'Spoken explanation or transcript',
      };
    case 'payment':
      return {
        title: 'Payment Confirmation',
        subtitle: `${data.senderName || participantName} -> ${data.recipientName || '?'} · ${data.date || ''}`,
      };
    case 'email':
      return {
        title: `Email - ${data.subject || participantName}`,
        subtitle: `${data.sender || participantName} · Written correspondence`,
      };
    case 'note':
      return {
        title: `Written Note - ${participantName}`,
        subtitle: `${data.summary || 'Participant explanation'}`,
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
    system:
      'You are a precise evidence analyst for a shared expense mediator. Extract only what is clearly visible or explicitly stated. If uncertain, lower confidence rather than guessing.',
    tools: [tool as Anthropic.Tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content }],
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
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
    const base64 = await fileToBase64(file);
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: TYPE_PROMPT[evidenceType] },
    ];
  } else if (isPDF(file)) {
    const base64 = await fileToBase64(file);
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as unknown as Anthropic.TextBlockParam,
      { type: 'text', text: TYPE_PROMPT[evidenceType] },
    ];
  } else if (isTextFile(file)) {
    const text = await fileToText(file);
    content = [
      {
        type: 'text',
        text: `${TYPE_PROMPT[evidenceType]}\n\nParticipant: ${participantName}\n\nSubmitted file: ${file.name}\n\nContent:\n${text}`,
      },
    ];
  } else {
    throw new Error(
      `Unsupported file type: ${file.type || file.name}. Use images, PDFs, or text documents such as TXT, MD, CSV, JSON, or EML.`,
    );
  }

  const data = await callAnalysisTool(client, content, evidenceType);
  const built = buildTitleFromType(evidenceType, data, participantName);
  const facts = (data.extractedFacts as string[]) || [];
  const confidence = Math.round((data.confidence as number) ?? 70);

  let previewUrl: string | undefined;
  if (isImage(file)) previewUrl = URL.createObjectURL(file);

  return {
    id,
    participantId,
    type: evidenceType,
    status: 'done',
    title: built.title,
    subtitle: built.subtitle,
    extractedFacts: facts,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    dateRange: built.dateRange,
    structuredData: data,
    fileName: file.name,
    filePreviewUrl: previewUrl,
  };
}

export async function analyzeTextEvidence(
  apiKey: string,
  text: string,
  evidenceType: EvidenceType,
  participantId: string,
  participantName: string,
  customTitle?: string,
): Promise<AnalyzedEvidence> {
  const client = makeClient(apiKey);
  const id = `${participantId}-${evidenceType}-text-${Date.now()}`;

  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `${TYPE_PROMPT[evidenceType]}\n\nParticipant: ${participantName}\n\nSubmitted content:\n${text}`,
    },
  ];

  const data = await callAnalysisTool(client, content, evidenceType);
  const built = buildTitleFromType(evidenceType, data, participantName);
  const facts = (data.extractedFacts as string[]) || [];
  const confidence = Math.round((data.confidence as number) ?? 65);

  return {
    id,
    participantId,
    type: evidenceType,
    status: 'done',
    title: customTitle?.trim() || built.title,
    subtitle: built.subtitle,
    extractedFacts: facts,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    dateRange: built.dateRange,
    structuredData: data,
  };
}

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
          description: 'Decompose the total bill into cost categories, ideally 2-4 groups',
          items: {
            type: 'object',
            required: ['name', 'amount', 'explanation', 'splitLogic', 'perPerson'],
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              explanation: { type: 'string' },
              splitLogic: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              perPerson: {
                type: 'object',
                properties: perPersonProps,
                required: participantIds,
              },
            },
          },
        },
        shares: {
          type: 'array',
          items: {
            type: 'object',
            required: ['participantId', 'fairShare', 'reasoning'],
            properties: {
              participantId: { type: 'string', enum: participantIds },
              fairShare: { type: 'number' },
              reasoning: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        overallReasoning: { type: 'array', items: { type: 'string' } },
        settlement: { type: 'array', items: { type: 'string' } },
        confidenceLabel: { type: 'string', enum: ['Low', 'Medium', 'Medium-high', 'High'] },
        confidenceValue: { type: 'number' },
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
  const participantIds = participants.map(participant => participant.id);
  const payer = participants.reduce((max, participant) =>
    participant.paidAmount > max.paidAmount ? participant : max,
  );

  const paymentHistory = participants
    .map(participant => {
      if (participant.paidAmount >= billTotal) {
        return `- ${participant.name} (id: ${participant.id}) paid the full EUR ${participant.paidAmount} bill upfront`;
      }
      if (participant.paidAmount > 0) {
        return `- ${participant.name} (id: ${participant.id}) has already paid EUR ${participant.paidAmount} toward this bill`;
      }
      return `- ${participant.name} (id: ${participant.id}) has paid EUR 0 so far`;
    })
    .join('\n');

  const evidenceSummary = evidence
    .filter(item => item.status === 'done')
    .map(item => {
      const owner = participants.find(participant => participant.id === item.participantId)?.name ?? item.participantId;
      return `[${item.type.toUpperCase()}] submitted by ${owner}\n  Title: ${item.title}\n  Facts: ${item.extractedFacts.join(' | ')}\n  Confidence: ${item.confidence}%`;
    })
    .join('\n\n');

  const prompt = `Shared expense dispute:
Title: "${title}"
${period ? `Period: ${period}` : ''}
Total bill: EUR ${billTotal}
Participants (${participants.length}): ${participants.map(participant => participant.name).join(', ')}

Payment history:
${paymentHistory}

Evidence submitted (${evidence.filter(item => item.status === 'done').length} items):
${evidenceSummary || 'No evidence submitted yet - base recommendation only.'}

Generate a fair split recommendation. Analyze the bill into logical cost categories based on the evidence type. Utilities can use Fixed/Baseline/Variable. Other disputes can use categories that fit the evidence.

Weight costs by evidence of presence, usage, prior agreements, or prior payments. Be transparent when evidence is limited.

Important: Use the exact participantId values: ${participantIds.map(id => `"${id}"`).join(', ')}.
The fair shares must sum to exactly EUR ${billTotal}.
The primary payer is ${payer.name} (id: "${payer.id}") who paid EUR ${payer.paidAmount} upfront.`;

  const tool = buildRecommendationTool(participantIds);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are FairSplit, a neutral AI expense mediator. Your recommendations are non-binding and evidence-based.
Key principles:
- Always explain your reasoning clearly
- Acknowledge uncertainty when evidence is missing
- Be fair to all parties
- The fair shares must sum to exactly EUR ${billTotal}`,
    tools: [tool as unknown as Anthropic.Tool],
    tool_choice: { type: 'tool', name: 'generate_fair_split' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
  if (!toolUse) throw new Error('No recommendation from Claude');

  type RawData = {
    costComponents: Array<{
      name: string;
      amount: number;
      explanation: string;
      splitLogic: string;
      examples?: string[];
      perPerson: Record<string, number>;
    }>;
    shares: Array<{ participantId: string; fairShare: number; reasoning: string[] }>;
    overallReasoning: string[];
    settlement: string[];
    confidenceLabel: string;
    confidenceValue: number;
  };

  const raw = toolUse.input as RawData;
  const equalShare = billTotal / participants.length;
  const paidAmounts: Record<string, number> = Object.fromEntries(
    participants.map(participant => [participant.id, participant.paidAmount]),
  );

  const costComponents: CostComponent[] = raw.costComponents.map((component, index) => ({
    id: component.name.toLowerCase().replace(/\s+/g, '-'),
    name: component.name,
    amount: component.amount,
    splitLogic: component.splitLogic,
    explanation: component.explanation,
    examples: component.examples || [],
    perPerson: component.perPerson,
    ...(COST_COLORS[index] ?? COST_COLORS[2]),
  }));

  const shares: ParticipantShare[] = raw.shares.map(share => {
    const alreadyPaid = paidAmounts[share.participantId] ?? 0;
    const isPayer = share.participantId === payer.id;
    const adjustment = Math.round(share.fairShare - equalShare);
    const amountOwedToPayer = isPayer ? 0 : Math.max(0, share.fairShare - alreadyPaid);
    const stillOwes = isPayer ? -(billTotal - share.fairShare) : amountOwedToPayer;

    return {
      participantId: share.participantId,
      equalShare: Math.round(equalShare),
      fairShare: share.fairShare,
      adjustment,
      amountOwedToPayer,
      alreadyPaid,
      stillOwes,
      reasoning: share.reasoning,
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

export async function streamChallengeResponse(
  apiKey: string,
  challengeText: string,
  participantName: string,
  recommendation: RecommendationResult,
  evidence: AnalyzedEvidence[],
  onToken: (token: string) => void,
): Promise<void> {
  const client = makeClient(apiKey);

  const recommendationSummary = recommendation.shares
    .map(share => `${share.participantId}: EUR ${share.fairShare} (${share.adjustment >= 0 ? '+' : ''}${share.adjustment} from equal split)`)
    .join(', ');

  const evidenceSummary = evidence
    .filter(item => item.status === 'done')
    .map(item => `${item.type}: ${item.title} (${item.confidence}% confidence)`)
    .join('; ');

  const prompt = `CURRENT RECOMMENDATION: ${recommendationSummary}
CONFIDENCE: ${recommendation.confidenceLabel}

EVIDENCE ON FILE: ${evidenceSummary || 'Limited evidence'}

CHALLENGE from ${participantName}:
"${challengeText}"

Respond as a fair mediator in 3-4 sentences. Acknowledge the argument, state what evidence would strengthen or weaken it, and whether the recommendation should change based on what is currently available. Be constructive and neutral.`;

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: 512,
    system:
      'You are FairSplit, a neutral AI expense mediator. Be concise, fair, and constructive. Do not use legal language. Your responses are non-binding.',
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onToken(event.delta.text);
    }
  }
}

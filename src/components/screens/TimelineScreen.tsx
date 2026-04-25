import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  Info,
  Mail,
  NotebookPen,
  Plane,
  ShieldCheck,
} from 'lucide-react';
import { AnalyzedEvidence, DisputeSetup, EvidenceType, Screen } from '../../types';

interface Props {
  setup: DisputeSetup;
  onNavigate: (screen: Screen) => void;
  analyzedEvidence: AnalyzedEvidence[];
}

interface TimelinePeriod {
  label: string;
  month: number | null;
  monthName: string | null;
  startDay: number;
  endDay: number;
  totalDays: number;
}

interface Segment {
  days: number;
  home: boolean;
  label: string;
  startDay: number;
  endDay: number;
}

interface Marker {
  key: string;
  dateLabel: string;
  label: string;
  source: string;
  sortDay: number;
  color: string;
  bg: string;
  border: string;
  icon: typeof Plane;
}

interface ParsedDate {
  month: number;
  monthName: string;
  day: number;
  year?: number;
}

const MONTH_LOOKUP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const EVIDENCE_META: Record<
  EvidenceType,
  { icon: typeof Plane; color: string; bg: string; border: string; source: string }
> = {
  bill: {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    source: 'Bill evidence',
  },
  receipt: {
    icon: FileText,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    source: 'Receipt evidence',
  },
  ticket: {
    icon: Plane,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    source: 'Travel evidence',
  },
  calendar: {
    icon: CalendarDays,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    source: 'Calendar evidence',
  },
  chat: {
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    source: 'Chat evidence',
  },
  voice: {
    icon: FileText,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    source: 'Voice evidence',
  },
  payment: {
    icon: CreditCard,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    source: 'Payment evidence',
  },
  email: {
    icon: Mail,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    source: 'Email evidence',
  },
  note: {
    icon: NotebookPen,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    source: 'Written evidence',
  },
};

function parseDateValue(value: unknown): ParsedDate | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\u2013/g, '-');
  const match = cleaned.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i);
  if (!match) return null;

  const monthKey = match[1].toLowerCase();
  const month = MONTH_LOOKUP[monthKey];
  if (month === undefined) return null;

  const day = Number(match[2]);
  if (!Number.isFinite(day)) return null;

  const year = match[3] ? Number(match[3]) : undefined;
  return {
    month,
    monthName: MONTH_NAMES[month],
    day,
    year: Number.isFinite(year) ? year : undefined,
  };
}

function makeRange(
  startValue: unknown,
  endValue: unknown,
  period: TimelinePeriod,
): { startDay: number; endDay: number } | null {
  const start = parseDateValue(startValue);
  const end = parseDateValue(endValue);
  if (!start || !end) return null;

  if (period.month !== null && start.month !== period.month && end.month !== period.month) {
    return null;
  }

  const startDay = Math.max(period.startDay, Math.min(start.day, period.endDay));
  const endDay = Math.max(period.startDay, Math.min(end.day, period.endDay));
  if (endDay < startDay) return null;

  return { startDay, endDay };
}

function inferTimelinePeriod(setup: DisputeSetup, evidence: AnalyzedEvidence[]): TimelinePeriod {
  const doneEvidence = evidence.filter(item => item.status === 'done');
  const sharedBill = doneEvidence.find(item => item.participantId === 'shared' && item.type === 'bill');
  const candidates = sharedBill ? [sharedBill, ...doneEvidence] : doneEvidence;

  for (const item of candidates) {
    const structured = item.structuredData;
    const range =
      makeRange(structured.periodStart, structured.periodEnd, {
        label: '',
        month: null,
        monthName: null,
        startDay: 1,
        endDay: 31,
        totalDays: 31,
      }) ??
      makeRange(item.dateRange?.start, item.dateRange?.end, {
        label: '',
        month: null,
        monthName: null,
        startDay: 1,
        endDay: 31,
        totalDays: 31,
      });

    const start = parseDateValue(structured.periodStart ?? item.dateRange?.start);
    const end = parseDateValue(structured.periodEnd ?? item.dateRange?.end);

    if (range && start && end && start.month === end.month) {
      return {
        label: setup.period.trim() || `${start.monthName}${start.year ? ` ${start.year}` : ''}`,
        month: start.month,
        monthName: start.monthName,
        startDay: range.startDay,
        endDay: range.endDay,
        totalDays: range.endDay - range.startDay + 1,
      };
    }
  }

  return {
    label: setup.period.trim() || 'Selected period',
    month: null,
    monthName: null,
    startDay: 1,
    endDay: 30,
    totalDays: 30,
  };
}

function mergeRanges(ranges: Array<{ startDay: number; endDay: number }>) {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.startDay - b.startDay);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];
    if (current.startDay <= previous.endDay + 1) {
      previous.endDay = Math.max(previous.endDay, current.endDay);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function getAbsenceRanges(evidence: AnalyzedEvidence[], period: TimelinePeriod) {
  const ranges: Array<{ startDay: number; endDay: number }> = [];

  evidence.forEach(item => {
    const structured = item.structuredData;

    if (Array.isArray(structured.absencePeriods)) {
      structured.absencePeriods.forEach(periodItem => {
        if (typeof periodItem !== 'object' || periodItem === null) return;
        const range = makeRange(
          (periodItem as Record<string, unknown>).start,
          (periodItem as Record<string, unknown>).end,
          period,
        );
        if (range) ranges.push(range);
      });
    }

    const structuredRange = makeRange(structured.departureDate, structured.returnDate, period);
    if (structuredRange) ranges.push(structuredRange);

    const evidenceRange = makeRange(item.dateRange?.start, item.dateRange?.end, period);
    if (evidenceRange && (item.type === 'ticket' || item.type === 'calendar')) {
      ranges.push(evidenceRange);
    }
  });

  return mergeRanges(ranges);
}

function buildSegments(
  period: TimelinePeriod,
  ranges: Array<{ startDay: number; endDay: number }>,
): Segment[] {
  if (ranges.length === 0) {
    return [
      {
        days: period.totalDays,
        home: true,
        label: 'Home',
        startDay: period.startDay,
        endDay: period.endDay,
      },
    ];
  }

  const segments: Segment[] = [];
  let cursor = period.startDay;

  ranges.forEach(range => {
    if (range.startDay > cursor) {
      segments.push({
        days: range.startDay - cursor,
        home: true,
        label: 'Home',
        startDay: cursor,
        endDay: range.startDay - 1,
      });
    }

    segments.push({
      days: range.endDay - range.startDay + 1,
      home: false,
      label: 'Away',
      startDay: range.startDay,
      endDay: range.endDay,
    });

    cursor = range.endDay + 1;
  });

  if (cursor <= period.endDay) {
    segments.push({
      days: period.endDay - cursor + 1,
      home: true,
      label: 'Home',
      startDay: cursor,
      endDay: period.endDay,
    });
  }

  return segments;
}

function getDayLabels(period: TimelinePeriod) {
  const points = [0, 0.25, 0.5, 0.75, 1].map(point =>
    Math.round(period.startDay + point * (period.totalDays - 1)),
  );
  return [...new Set(points)];
}

function getMarkerDate(evidence: AnalyzedEvidence) {
  const structured = evidence.structuredData;
  if (typeof structured.date === 'string') return structured.date;
  if (evidence.dateRange) {
    return evidence.dateRange.start === evidence.dateRange.end
      ? evidence.dateRange.start
      : `${evidence.dateRange.start} - ${evidence.dateRange.end}`;
  }
  if (typeof structured.periodStart === 'string' && typeof structured.periodEnd === 'string') {
    return `${structured.periodStart} - ${structured.periodEnd}`;
  }
  return null;
}

function getMarkerSortDay(evidence: AnalyzedEvidence, period: TimelinePeriod) {
  const structured = evidence.structuredData;
  const parsed =
    parseDateValue(structured.date) ??
    parseDateValue(evidence.dateRange?.start) ??
    parseDateValue(structured.periodStart);

  if (!parsed) return Number.MAX_SAFE_INTEGER;
  if (period.month !== null && parsed.month !== period.month) return period.totalDays + parsed.day;
  return parsed.day;
}

function PresenceBar({
  segments,
  color,
  totalDays,
  delay,
}: {
  segments: Segment[];
  color: string;
  totalDays: number;
  delay: number;
}) {
  return (
    <div className="flex w-full h-10 rounded-xl overflow-hidden gap-0.5">
      {segments.map((segment, index) => (
        <motion.div
          key={`${segment.startDay}-${segment.endDay}-${index}`}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: delay + index * 0.12, ease: 'easeOut' }}
          style={{
            width: `${(segment.days / totalDays) * 100}%`,
            transformOrigin: 'left',
            background: segment.home
              ? undefined
              : 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f1f5f9 4px, #f1f5f9 8px)',
          }}
          className={`flex items-center justify-center text-xs font-semibold rounded-lg ${
            segment.home ? `${color} text-white` : 'text-slate-400 border border-slate-200'
          }`}
          title={`${segment.label} (${segment.startDay}-${segment.endDay})`}
        >
          {segment.days >= Math.max(4, Math.round(totalDays / 8))
            ? segment.home
              ? `${segment.days}d`
              : `${segment.days}d away`
            : ''}
        </motion.div>
      ))}
    </div>
  );
}

export default function TimelineScreen({ setup, onNavigate, analyzedEvidence }: Props) {
  const doneEvidence = analyzedEvidence.filter(item => item.status === 'done');
  const period = inferTimelinePeriod(setup, doneEvidence);
  const dayLabels = getDayLabels(period);
  const monthDays = Array.from(
    { length: period.totalDays },
    (_, index) => period.startDay + index,
  );

  const participantSummaries = setup.participants.map(participant => {
    const participantEvidence = doneEvidence.filter(item => item.participantId === participant.id);
    const absenceRanges = getAbsenceRanges(participantEvidence, period);
    const segments = buildSegments(period, absenceRanges);
    const daysAway = absenceRanges.reduce(
      (total, range) => total + (range.endDay - range.startDay + 1),
      0,
    );
    const timelineEvidenceCount = participantEvidence.filter(
      item => item.type === 'ticket' || item.type === 'calendar',
    ).length;

    return {
      participant,
      segments,
      daysAway,
      daysHome: period.totalDays - daysAway,
      note:
        daysAway > 0
          ? `Verified by ${timelineEvidenceCount} timeline evidence item${timelineEvidenceCount === 1 ? '' : 's'}`
          : timelineEvidenceCount > 0
          ? 'No away period extracted from evidence'
          : 'No timeline evidence yet',
    };
  });

  const markers: Marker[] = doneEvidence
    .map(item => {
      const dateLabel = getMarkerDate(item);
      if (!dateLabel) return null;

      const owner = setup.participants.find(participant => participant.id === item.participantId);
      const meta = EVIDENCE_META[item.type];

      return {
        key: item.id,
        dateLabel,
        label: owner ? `${owner.name}: ${item.title}` : item.title,
        source: meta.source,
        sortDay: getMarkerSortDay(item, period),
        color: meta.color,
        bg: meta.bg,
        border: meta.border,
        icon: meta.icon,
      };
    })
    .filter((marker): marker is Marker => marker !== null)
    .sort((a, b) => a.sortDay - b.sortDay)
    .slice(0, 8);

  const gridClass =
    setup.participants.length === 2
      ? 'md:grid-cols-2'
      : setup.participants.length === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-2 lg:grid-cols-4';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
          Step 3 of 6
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Presence Timeline</h1>
        <p className="text-slate-500 mt-1">
          Evidence-backed presence analysis for {period.label}.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="font-semibold text-slate-800">
            {period.label} - {period.totalDays} days
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> Home
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block border border-slate-200"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 2px, #f1f5f9 2px, #f1f5f9 4px)',
                }}
              />{' '}
              Away / verified absence
            </span>
          </div>
        </div>

        <div className="flex w-full mb-3 px-0.5">
          {monthDays.map(day => (
            <div key={day} className="flex-1 text-center">
              {dayLabels.includes(day) && (
                <span className="text-xs text-slate-400 font-medium">{day}</span>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {participantSummaries.map(({ participant, segments }, index) => (
            <div key={participant.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <div
                  className={`w-8 h-8 ${participant.bgClass} rounded-full flex items-center justify-center text-white text-xs font-bold`}
                >
                  {participant.name[0]}
                </div>
                <span className="font-semibold text-slate-700 text-sm truncate">
                  {participant.name}
                </span>
              </div>
              <div className="flex-1">
                <PresenceBar
                  segments={segments}
                  color={participant.bgClass}
                  totalDays={period.totalDays}
                  delay={index * 0.12}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Timeline Markers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {markers.map((marker, index) => {
              const Icon = marker.icon;
              return (
                <motion.div
                  key={marker.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${marker.bg} ${marker.border}`}
                >
                  <Icon className={`w-4 h-4 ${marker.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      <span className="text-slate-400 mr-1.5">{marker.dateLabel}</span>
                      {marker.label}
                    </p>
                    <p className="text-xs text-slate-400">{marker.source}</p>
                  </div>
                </motion.div>
              );
            })}

            {markers.length === 0 && (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 flex items-center gap-3 col-span-full">
                <Info className="w-4 h-4 text-slate-300" />
                <p className="text-xs text-slate-400">
                  Add dated evidence such as tickets, calendars, bills, or payment confirmations to populate the timeline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
        {participantSummaries.map(({ participant, daysHome, daysAway, note }) => (
          <div key={participant.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{participant.emoji}</span>
              <span className="font-semibold text-slate-800">{participant.name}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Days home</span>
                <span className={`text-sm font-bold ${participant.textClass}`}>{daysHome}d</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Days away</span>
                <span className="text-sm font-bold text-slate-500">{daysAway}d</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(daysHome / period.totalDays) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className={`h-full ${participant.bgClass} rounded-full`}
                />
              </div>
              <p className="text-xs text-slate-400">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Privacy notice:</strong> FairSplit does not track users
          automatically or access live location data. This timeline is generated only from evidence
          voluntarily provided for this dispute in the current session.
        </p>
      </div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('costmodel')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2.5 shadow-sm"
        >
          View Cost Model
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

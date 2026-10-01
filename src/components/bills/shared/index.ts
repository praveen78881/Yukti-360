/* Shared, PURELY PRESENTATIONAL kit for the Bills Receivable / Bills Payable
   pages. Props in, pixels out — no data fetching, no lib/offlineDb calls.
   Pages own their data and derive everything with the pure helpers below.
   See the plan: scratchpad/bills/PLAN.md. */

export { Panel } from './Panel';
export { KpiStrip, KpiTile, type KpiTileProps } from './KpiStrip';
export { StatusChip, Tag } from './StatusChip';
export { PartPaidBar } from './PartPaidBar';
export { AgeingBar, type AgeingSegment } from './AgeingBar';
export { AgeingTable } from './AgeingTable';
export { PartyConcentration, type PartyDatum } from './PartyConcentration';
export { DueTimeline } from './DueTimeline';
export { MonthlyBars } from './MonthlyBars';
export { FilterRow, SearchField, FilterChips, SegmentedToggle, SortSelect, type ChipOption } from './FilterBar';
export { EmptyState } from './EmptyState';
export { ReconCallout } from './ReconCallout';
export { PartyFocusBar } from './PartyFocusBar';
export { SidePanel, DetailField, MoneyLine } from './SidePanel';

export {
  STATUS_META,
  DUE_BUCKETS,
  SCHEDULE_III_BUCKETS,
  deriveStatus,
  dueBucketOf,
  buildWeekBuckets,
  buildMonthBuckets,
  niceMax,
  type BillStatus,
  type DueBucketKey,
  type S3BucketKey,
  type WeekBucket,
  type MonthBucket,
} from './buckets';

export {
  formatINR,
  formatINRCompact,
  formatDate,
  formatDateShort,
  localISODate,
  daysBetween,
  addDays,
  relativeDue,
  plural,
} from './format';

export { AGEING_RAMP, ACCENT, DEEMPH } from './tokens';

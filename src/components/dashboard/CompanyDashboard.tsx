import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, ShoppingCart, Receipt,
  Users, PieChart as PieIcon, ArrowUpRight,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { computeAllBalances } from '@/lib/accounting/computeEngine';
import { computeTradingAccount } from '@/lib/accounting/tradingAccountCompute';
import { computeProfitLoss } from '@/lib/accounting/profitLossCompute';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';

/* ── The company dashboard ─────────────────────────────────────────────────
   Fills the free centre behind the assistant orb. Top band: four year-wise
   KPIs (Turnover · Expenses · Gross Profit · Net Profit). Below: a left column
   (Purchase/month, Debtors), a right column (Sales/month, Creditors), and a
   month-wise revenue donut in the middle. Everything is derived live from the
   journal, so it fills in as the books are kept. */

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/** Chronological month index within the Indian FY (Apr = 0 … Mar = 11). */
function fyMonthIndex(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return -1;
  return ((d.getMonth() - 3) + 12) % 12;
}

function shortINR(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

/** yyyy-mm-dd → "02 Apr 26" for the active-range caption. */
function fmtDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Linear blend between two #rrggbb colours, t in 0…1. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

const CSS = `
.yk-dash{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;gap:12px;padding:2px;color:var(--ink)}
.yk-dash-head{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:10px}
.yk-dash-head .per{font-family:var(--font-display);font-weight:600;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.yk-dash-kpis{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.yk-dash-mid{flex:1 1 0;min-height:0;display:grid;gap:12px;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1.25fr}
.yk-dash-pie{flex:1 1 0;min-height:0}
/* right gutter keeps the whole band clear of the docked orb's corner */
.yk-pie-body{flex:1 1 auto;min-height:0;display:flex;gap:16px;padding:8px 150px 8px 14px}
.yk-pie-rank{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:2px}
.yk-pie-donut{position:relative;flex:0 0 clamp(160px,26%,260px);min-width:0}
.yk-rank-row{display:flex;align-items:center;gap:10px}
.yk-rank-m{width:30px;font-weight:700;font-size:11px;color:var(--ink-2);flex-shrink:0}
.yk-rank-track{flex:1 1 auto;height:9px;border-radius:999px;background:var(--cream);overflow:hidden;min-width:0}
.yk-rank-track i{display:block;height:100%;border-radius:999px}
.yk-rank-v{width:88px;text-align:right;font-size:11.5px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;flex-shrink:0}
.yk-rank-pct{width:40px;text-align:right;font-size:10.5px;color:var(--ink-3);flex-shrink:0}
.yk-card{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;
  background:var(--card-solid);border:1px solid var(--sand);border-radius:14px;
  box-shadow:0 1px 2px rgba(24,44,70,.05),0 14px 30px -22px rgba(24,44,70,.5);overflow:hidden}
.yk-kpi{padding:14px 15px;text-decoration:none;transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}
.yk-kpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
.yk-kpi:hover{transform:translateY(-2px);border-color:var(--sand-2);box-shadow:0 2px 4px rgba(24,44,70,.07),0 22px 40px -24px rgba(24,44,70,.55)}
.yk-kpi-top{display:flex;align-items:center;gap:8px}
.yk-kpi-ico{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9px;
  background:color-mix(in srgb,var(--accent) 14%,#fff);color:var(--accent);flex-shrink:0}
.yk-kpi-label{font-family:var(--font-display);font-weight:600;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yk-kpi-arrow{width:14px;height:14px;margin-left:auto;color:var(--ink-3);opacity:0;transition:opacity 160ms ease,transform 160ms ease;flex-shrink:0}
.yk-kpi:hover .yk-kpi-arrow{opacity:1;transform:translate(1px,-1px)}
.yk-kpi-value{margin-top:10px;font-weight:800;font-size:clamp(20px,2.2vw,28px);line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.yk-kpi-sub{margin-top:6px;font-size:11px;color:var(--ink-3)}
.yk-card-head{display:flex;align-items:center;gap:8px;padding:clamp(7px,1.4vh,11px) 14px clamp(6px,1.1vh,9px);border-bottom:1px solid var(--cream)}
.yk-card-ico{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;
  background:color-mix(in srgb,var(--accent) 14%,#fff);color:var(--accent);flex-shrink:0}
.yk-card-title{font-family:var(--font-display);font-weight:600;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2)}
.yk-card-link{margin-left:auto;display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:var(--ink-3);text-decoration:none;text-transform:uppercase;letter-spacing:.08em;transition:color 160ms ease}
.yk-card-link:hover{color:var(--navy)}
.yk-card-link svg{width:12px;height:12px}
.yk-card-body{flex:1 1 auto;min-height:0;position:relative;padding:8px 10px 6px}
.yk-stat-body{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:clamp(3px,0.7vh,7px);padding:clamp(4px,1vh,10px) 16px clamp(6px,1.1vh,12px)}
.yk-stat-value{font-weight:800;font-size:clamp(17px,2.6vh,28px);line-height:1.05;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.yk-stat-cap{font-size:clamp(9.5px,1.5vh,11px);line-height:1.2;color:var(--ink-3)}
.yk-stat-bar{height:clamp(5px,0.8vh,6px);border-radius:999px;background:var(--cream);overflow:hidden;flex-shrink:0}
.yk-stat-bar i{display:block;height:100%;border-radius:999px;background:var(--accent)}
.yk-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.yk-donut-center .v{font-weight:800;font-size:clamp(15px,1.5vw,20px);line-height:1;font-variant-numeric:tabular-nums;color:var(--ink)}
.yk-donut-center .l{margin-top:4px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.yk-legend{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;padding:2px 10px 8px}
.yk-legend span{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--ink-2)}
.yk-legend i{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.yk-empty{flex:1;display:grid;place-items:center;text-align:center;color:var(--ink-3);font-size:12px;padding:16px}
.yk-tip{background:#fff;border:1px solid var(--sand);border-radius:10px;padding:7px 10px;box-shadow:0 10px 26px -14px rgba(24,44,70,.5)}
.yk-tip .t{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.yk-tip .v{margin-top:2px;font-size:13px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
/* Wide but very short viewports stay in fit-to-stage mode, so the stat cards
   get squeezed. Top-align the figure (the amount is never clipped) and reclaim
   height from the card head so the caption + bar keep their place too. */
@media (min-width:901px) and (max-height:620px){
  .yk-card-head{padding:6px 14px 5px}
  .yk-card-ico{width:22px;height:22px;border-radius:7px}
  .yk-stat-body{justify-content:flex-start;gap:3px;padding:6px 16px 7px}
}
@media (max-width:900px){
  .yk-dash{position:relative;inset:auto;padding-bottom:180px}
  .yk-dash-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .yk-dash-mid{grid-template-columns:1fr;grid-template-rows:none;grid-auto-rows:minmax(190px,auto)}
  .yk-dash-mid>*{grid-column:auto!important;grid-row:auto!important}
  .yk-dash-pie{min-height:320px}
  .yk-pie-body{flex-direction:column;padding:8px 12px 6px}
  .yk-pie-donut{flex-basis:200px}
}
`;

interface KpiDef { key: string; label: string; value: number; accent: string; icon: typeof TrendingUp; to: string; signed?: boolean }

function Kpi({ def, loading, companyId, period }: { def: KpiDef; loading: boolean; companyId: string; period: string }) {
  const negative = def.signed && def.value < 0;
  const shown = def.signed ? shortINR(Math.abs(def.value)) : shortINR(def.value);
  return (
    <Link to={`/company/${companyId}/${def.to}`} className="yk-card yk-kpi" style={{ '--accent': def.accent } as CSSProperties}>
      <div className="yk-kpi-top">
        <span className="yk-kpi-ico"><def.icon className="h-4 w-4" strokeWidth={1.9} /></span>
        <span className="yk-kpi-label">{negative && def.key === 'net' ? 'Net Loss' : def.label}</span>
        <ArrowUpRight className="yk-kpi-arrow" />
      </div>
      <div className="yk-kpi-value" style={{ color: negative ? 'var(--bad)' : 'var(--ink)' }}>
        {loading ? '—' : shown}
      </div>
      <div className="yk-kpi-sub">{period}</div>
    </Link>
  );
}

function CardHead({ title, accent, icon: Icon, to, companyId }: {
  title: string; accent: string; icon: typeof TrendingUp; to: string; companyId: string;
}) {
  return (
    <div className="yk-card-head" style={{ '--accent': accent } as CSSProperties}>
      <span className="yk-card-ico"><Icon className="h-3.5 w-3.5" strokeWidth={1.9} /></span>
      <span className="yk-card-title">{title}</span>
      <Link to={`/company/${companyId}/${to}`} className="yk-card-link">Open <ArrowUpRight /></Link>
    </div>
  );
}

function BarTip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="yk-tip">
      <div className="t">{label}{suffix ? ` · ${suffix}` : ''}</div>
      <div className="v">{formatIndianCurrency(payload[0].value)}</div>
    </div>
  );
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="yk-tip">
      <div className="t">{p.payload.label}{p.payload.pct != null ? ` · ${p.payload.pct}%` : ''}</div>
      <div className="v">{formatIndianCurrency(p.value)}</div>
    </div>
  );
}

function MonthBars({ data, color, suffix }: { data: { m: string; value: number }[]; color: string; suffix: string }) {
  const hasData = data.some((d) => d.value !== 0);
  if (!hasData) return <div className="yk-empty">No {suffix.toLowerCase()} recorded this year yet.</div>;
  return (
    <div className="yk-card-body">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--cream)" />
          <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} interval={0} />
          <YAxis hide />
          <Tooltip cursor={{ fill: 'rgba(23,69,127,0.06)' }} content={<BarTip suffix={suffix} />} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompanyDashboard() {
  const { company, companyId, loading } = useCompany();
  const fy = getCurrentFY();

  // Date-range filter: the dashboard scopes to the current FY by default; the
  // top-right filter box narrows every metric below to any chosen range.
  const [range, setRange] = useState<{ from: string; to: string }>({ from: fy.start, to: fy.end });
  const filtered = range.from !== fy.start || range.to !== fy.end;
  const periodLabel = filtered ? `${fmtDay(range.from)} – ${fmtDay(range.to)}` : fy.label;

  const { entries, loading: entriesLoading } = useJournalEntries({
    companyId: companyId || '',
    fromDate: range.from,
    toDate: range.to,
    enabled: !!companyId,
  });

  const balances = useMemo(() => computeAllBalances(entries), [entries]);
  const trading = useMemo(() => computeTradingAccount(entries), [entries]);
  const pl = useMemo(() => computeProfitLoss(entries, trading.grossProfit), [entries, trading.grossProfit]);

  // Single pass: monthly sales & purchases, total turnover & expenses.
  const series = useMemo(() => {
    const sales = Array(12).fill(0) as number[];
    const purch = Array(12).fill(0) as number[];
    let turnover = 0, expenses = 0;
    for (const e of entries) {
      const m = fyMonthIndex(e.entry_date);
      if (m < 0) continue;
      for (const line of e.lines) {
        const name = (line.account_name || '').toLowerCase();
        const grp = line.account_group || '';
        const debit = line.debit || 0, credit = line.credit || 0;
        if (line.nature === 'revenue' && (grp === 'Revenue from Operations' || /sale/.test(name) || /revenue from operations/.test(name))) {
          const v = credit - debit;
          turnover += v; sales[m] += v;
        }
        if (/purchase/.test(name) || grp === 'Cost of Materials Consumed' || grp === 'Purchases of Stock-in-Trade') {
          purch[m] += debit - credit;
        }
        if (line.nature === 'expense') expenses += debit - credit;
      }
    }
    return {
      turnover,
      expenses,
      salesData: MONTHS.map((m, i) => ({ m, value: Math.max(0, Math.round(sales[i])) })),
      purchaseData: MONTHS.map((m, i) => ({ m, value: Math.max(0, Math.round(purch[i])) })),
    };
  }, [entries]);

  const debtors = useMemo(() =>
    balances.filter((b) => b.nature === 'asset' && (/debtor/.test(b.account_name.toLowerCase()) || /receivable/.test(b.account_name.toLowerCase())))
      .reduce((s, b) => s + b.balance, 0), [balances]);

  const creditors = useMemo(() =>
    balances.filter((b) => b.nature === 'liability' && (/creditor/.test(b.account_name.toLowerCase()) || /payable/.test(b.account_name.toLowerCase())))
      .reduce((s, b) => s + b.balance, 0), [balances]);

  // Month-wise revenue donut: coloured by revenue rank so the biggest months
  // read darkest — the chart literally shows which months earned the most.
  const revenue = useMemo(() => {
    const total = series.salesData.reduce((s, d) => s + d.value, 0);
    const order = [...series.salesData].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    const rankOf = new Map(order.map((d, i) => [d.m, i]));
    const n = Math.max(1, order.length - 1);
    const slices = series.salesData
      .filter((d) => d.value > 0)
      .map((d) => ({
        label: d.m,
        value: d.value,
        pct: total ? Math.round((d.value / total) * 100) : 0,
        color: mix('#0F3162', '#5FC9BE', (rankOf.get(d.m) ?? 0) / n),
      }));
    const ranked = [...slices].sort((a, b) => b.value - a.value);
    return { total, slices, ranked, max: ranked[0]?.value || 1 };
  }, [series.salesData]);

  if (loading || !company || !companyId) return null;

  const kpis: KpiDef[] = [
    { key: 'turnover', label: 'Turnover', value: series.turnover, accent: '#17457F', icon: TrendingUp, to: 'profit-loss' },
    { key: 'expenses', label: 'Expenses', value: series.expenses, accent: '#B26B15', icon: Wallet, to: 'profit-loss' },
    { key: 'gp', label: 'Gross Profit', value: trading.grossProfit, accent: '#2F7D5A', icon: TrendingUp, to: 'trading-account', signed: true },
    { key: 'net', label: 'Net Profit', value: pl.netProfit, accent: pl.netProfit < 0 ? '#B23B33' : '#2F7D5A', icon: pl.netProfit < 0 ? TrendingDown : TrendingUp, to: 'profit-loss', signed: true },
  ];

  const crTotal = debtors + creditors;

  return (
    <div className="yk-dash">
      <style>{CSS}</style>

      {/* ── Top-right date filter: scopes every metric below to the chosen range ── */}
      <div className="yk-dash-head">
        <span className="per">{periodLabel}</span>
        <DateRangeFilter
          fromDate={range.from}
          toDate={range.to}
          onDateChange={(from, to) => setRange({ from, to })}
        />
      </div>

      {/* ── Top band: year-wise KPIs ── */}
      <div className="yk-dash-kpis">
        {kpis.map((def) => <Kpi key={def.key} def={def} loading={entriesLoading} companyId={companyId} period={periodLabel} />)}
      </div>

      {/* ── Middle: four boxes — Purchase/Sales (top), Debtors/Creditors (bottom) ── */}
      <div className="yk-dash-mid">
        <div className="yk-card" style={{ gridColumn: 1, gridRow: 1 }}>
          <CardHead title="Purchase / month" accent="#B26B15" icon={ShoppingCart} to="purchase-register" companyId={companyId} />
          <MonthBars data={series.purchaseData} color="#D98A2B" suffix="Purchases" />
        </div>
        <div className="yk-card" style={{ gridColumn: 2, gridRow: 1 }}>
          <CardHead title="Sales / month" accent="#17457F" icon={Receipt} to="sales-register" companyId={companyId} />
          <MonthBars data={series.salesData} color="#2E6FB7" suffix="Sales" />
        </div>
        <StatCard
          title="Debtors" caption="Receivable" accent="#2E6FB7" icon={Users}
          to="debtors" companyId={companyId} value={debtors} loading={entriesLoading}
          ratio={crTotal ? debtors / crTotal : 0} gridColumn={1} gridRow={2} period={periodLabel}
        />
        <StatCard
          title="Creditors" caption="Payable" accent="#B26B15" icon={Receipt}
          to="creditors" companyId={companyId} value={creditors} loading={entriesLoading}
          ratio={crTotal ? creditors / crTotal : 0} gridColumn={2} gridRow={2} period={periodLabel}
        />
      </div>

      {/* ── Bottom band: month-wise revenue (full width) ── */}
      <div className="yk-card yk-dash-pie">
        <CardHead title="Month-wise revenue" accent="#17457F" icon={PieIcon} to="sales-register" companyId={companyId} />
        {revenue.slices.length === 0 ? (
          <div className="yk-empty">No revenue recorded this year yet.</div>
        ) : (
          <div className="yk-pie-body">
            <div className="yk-pie-rank">
              {revenue.ranked.slice(0, 6).map((s) => (
                <div className="yk-rank-row" key={s.label}>
                  <span className="yk-rank-m">{s.label}</span>
                  <span className="yk-rank-track"><i style={{ width: `${Math.max(4, Math.round((s.value / revenue.max) * 100))}%`, background: s.color }} /></span>
                  <span className="yk-rank-v">{shortINR(s.value)}</span>
                  <span className="yk-rank-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
            <div className="yk-pie-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenue.slices} dataKey="value" nameKey="label" cx="50%" cy="50%"
                    innerRadius="56%" outerRadius="88%" paddingAngle={1.5} stroke="#fff" strokeWidth={1.5}>
                    {revenue.slices.map((s) => <Cell key={s.label} fill={s.color} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="yk-donut-center">
                <span className="v">{shortINR(revenue.total)}</span>
                <span className="l">{periodLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title, caption, accent, icon: Icon, to, companyId, value, loading, ratio, gridColumn, gridRow, period,
}: {
  title: string; caption: string; accent: string; icon: typeof TrendingUp; to: string; companyId: string;
  value: number; loading: boolean; ratio: number; gridColumn: number; gridRow: number | string; period: string;
}): ReactNode {
  return (
    <div className="yk-card" style={{ gridColumn, gridRow }}>
      <CardHead title={title} accent={accent} icon={Icon} to={to} companyId={companyId} />
      <div className="yk-stat-body">
        <div className="yk-stat-value" style={{ color: accent }}>{loading ? '—' : shortINR(value)}</div>
        <div className="yk-stat-cap">{caption} · {period}</div>
        <div className="yk-stat-bar" style={{ '--accent': accent } as CSSProperties}>
          <i style={{ width: `${Math.round(Math.min(1, Math.max(0.04, ratio)) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default CompanyDashboard;

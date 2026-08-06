import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { GstConnectButton } from '@/components/gst/GstConnectButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { getGSTMidYearDate } from '@/lib/utils/edgeCases';
import { listInvoicesV2, listPurchaseInvoices } from '@/lib/accounting/gstInvoices';
import { getFiling } from '@/lib/gstr1/gstr1Db';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';

/* ── KPI icon constants ── */
const KPI_ICONS = {
  taxLiability: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797-2.101c.727-.198 1.453-.406 2.164-.624m-19.961 2.725A60.07 60.07 0 0 1 18.75 12.75m-18.75 6A59.94 59.94 0 0 1 21.485 12M2.25 18.75 9 12l2.25 2.25L15 10.5" />
    </svg>
  ),
  itc: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  outward: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
};

/* ── Module card configs ── */
const complianceModules = [
  {
    href: 'gst/search',
    label: 'Search / Verify GSTIN',
    desc: 'Live taxpayer lookup from the GST portal via Sandbox — verify any GSTIN and export it',
    gradient: 'from-white to-emerald-50/60',
    borderHover: 'hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600',
    badge: 'Live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    href: 'gst/itc-register',
    label: 'ITC Register',
    desc: 'Input Tax Credit register from purchase entries',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-400',
    iconBg: 'bg-gray-100 text-gray-600',
    badge: null,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    href: 'gst/ledgers',
    label: 'ITC & Cash Ledger',
    desc: 'Electronic Cash, Credit (ITC) and Liability ledgers — live balances and statements from the portal',
    gradient: 'from-white to-blue-50/60',
    borderHover: 'hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-600',
    badge: 'Live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    href: 'gst/gstr1',
    label: 'GSTR-1',
    desc: 'Outward supply statement — B2B, B2C, export summaries and JSON generation',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-400',
    iconBg: 'bg-gray-100 text-gray-600',
    badge: 'Monthly',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21l3.75-3.75" />
      </svg>
    ),
  },
  {
    href: 'gst/gstr3b',
    label: 'GSTR-3B',
    desc: 'Summary return with tax liability, ITC claims, and JSON download for portal filing',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-400',
    iconBg: 'bg-gray-100 text-gray-600',
    badge: 'Monthly',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
      </svg>
    ),
  },
  {
    href: 'gst/gstr2a',
    label: 'GSTR-2A',
    desc: 'Auto-populated inward supply statement from supplier filings for ITC reconciliation',
    gradient: 'from-white to-blue-50/60',
    borderHover: 'hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-600',
    badge: 'Live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    href: 'gst/gstr2b',
    label: 'GSTR-2B',
    desc: 'Static ITC statement generated monthly — definitive basis for claiming input tax credits',
    gradient: 'from-white to-blue-50/60',
    borderHover: 'hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-600',
    badge: 'Live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

const coreModules = [
  {
    href: 'gst/e-invoicing',
    label: 'e-Invoicing',
    desc: 'Generate and manage IRNs directly with the IRP portal',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-300',
    iconBg: 'bg-gray-100 text-gray-500',
    badge: 'Opens 31 Oct 2026',
    locked: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-7.5a2.25 2.25 0 0 1 2.25-2.25h.75" />
      </svg>
    ),
  },
  {
    href: 'gst/eway-bill',
    label: 'e-Way Bill Register',
    desc: 'Goods movement register and automated generation for consignments above threshold',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-300',
    iconBg: 'bg-gray-100 text-gray-500',
    badge: 'Opens 31 Oct 2026',
    locked: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    href: 'gst/annuals',
    label: 'GST Annuals (GSTR-9)',
    desc: 'Load and review the annual return (GSTR-9) figures from the portal',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-300',
    iconBg: 'bg-gray-100 text-gray-500',
    badge: 'Opens 31 Oct 2026',
    locked: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    href: 'gst/gstr9c',
    label: 'GSTR-9C Reconciliation',
    desc: 'Annual reconciliation statement between GSTR-9 and the audited financial statements',
    gradient: 'from-white to-gray-50/60',
    borderHover: 'hover:border-gray-300',
    iconBg: 'bg-gray-100 text-gray-500',
    badge: 'Opens 31 Oct 2026',
    locked: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

/* ── Trend indicator ── */
function TrendBadge({ trend, label }: { trend: 'up' | 'down' | 'neutral'; label: string }) {
  const styles = {
    up: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    down: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const arrows = { up: '\u2191', down: '\u2193', neutral: '\u2022' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[trend]}`}>
      <span className="text-[9px]">{arrows[trend]}</span>
      {label}
    </span>
  );
}

/* ── Module Card ── */
function ModuleCard({
  href,
  companyId,
  label,
  desc,
  gradient,
  borderHover,
  iconBg,
  badge,
  icon,
  statusChip,
  locked,
}: {
  href: string;
  companyId: string;
  label: string;
  desc: string;
  gradient: string;
  borderHover: string;
  iconBg: string;
  badge: string | null;
  icon: React.ReactNode;
  statusChip?: React.ReactNode;
  locked?: boolean;
}) {
  // "Coming Soon" / locked modules render a non-navigating card so a click
  // doesn't dead-end on a 404 instead of a live <Link>.
  const isComingSoon = badge === 'Coming Soon' || !!locked;
  const baseCls = `group relative block overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br ${gradient} p-5 transition-all duration-200`;
  const cls = isComingSoon
    ? `${baseCls} cursor-not-allowed opacity-60`
    : `${baseCls} ${borderHover} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60`;

  const inner = (
    <>
      {/* Decorative corner accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/40 transition-transform duration-300 group-hover:scale-150" />

      <div className="relative flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">{label}</h3>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${isComingSoon ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                {badge}
              </span>
            )}
            {statusChip}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
        </div>
        <svg className="h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </>
  );

  if (isComingSoon) {
    return <div className={cls} aria-disabled title={locked ? 'Opens on 31 October 2026' : 'Coming soon — not available yet'}>{inner}</div>;
  }
  return (
    <Link to={`/company/${companyId}/${href}`} className={cls}>
      {inner}
    </Link>
  );
}

/* ── Main Page ── */
export default function GSTPage() {
  const { company, companyId, loading } = useCompany();
  const fy = getCurrentFY();

  const kpiCards = useMemo(() => {
    if (!companyId) return [];
    const sales = listInvoicesV2(companyId).filter(
      (s) => s.invoice_date >= fy.start && s.invoice_date <= fy.end && s.status !== 'CANCELLED',
    );
    const purchases = listPurchaseInvoices(companyId).filter(
      (p) => p.invoice_date >= fy.start && p.invoice_date <= fy.end,
    );

    let taxLiability = 0;
    let totalOutward = 0;
    for (const s of sales) {
      taxLiability += s.total_cgst + s.total_sgst + s.total_igst;
      totalOutward += s.total_amount;
    }

    let availableITC = 0;
    for (const p of purchases) {
      if (p.itc_eligible && (!p.itc_status || p.itc_status === 'ELIGIBLE_FULL' || p.itc_status === 'ELIGIBLE_PARTIAL')) {
        availableITC += p.cgst + p.sgst + p.igst;
      }
    }

    return [
      { label: 'Estimated Tax Liability', value: formatIndianCurrency(taxLiability), trend: taxLiability > 0 ? 'up' as const : 'neutral' as const, trendLabel: 'Current period', icon: KPI_ICONS.taxLiability },
      { label: 'Available ITC', value: formatIndianCurrency(availableITC), trend: availableITC > 0 ? 'up' as const : 'neutral' as const, trendLabel: 'Input credits', icon: KPI_ICONS.itc },
      { label: 'Total Outward Supplies', value: formatIndianCurrency(totalOutward), trend: totalOutward > 0 ? 'up' as const : 'neutral' as const, trendLabel: 'Sales + adjustments', icon: KPI_ICONS.outward },
    ];
  }, [companyId, fy.start, fy.end]);

  // Portal reflection: the most recent GSTR-1 period we've filed (scan the last 12
  // months). Bound to our own filed record immediately; a track fetch confirms it.
  const gstr1Filed = useMemo(() => {
    if (!companyId) return null;
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth(); // 0-11
    for (let i = 0; i < 12; i++) {
      m--; if (m < 0) { m = 11; y--; }
      const period = String(m + 1).padStart(2, '0') + y;
      const f = getFiling(companyId, period);
      if (f?.filed) return { period, ...f.filed };
    }
    return null;
  }, [companyId]);
  const gstr1FiledChip = gstr1Filed
    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700" title={`ARN ${gstr1Filed.arn}`}>Filed ✓</span>
    : undefined;

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Open the Command Center if the entity is registered OR a GSTIN has been saved
  // in Settings (a saved GSTIN registers the entity even if the status flag lagged).
  const hasGstin = !!company.gst_details?.gstin;
  if (company.gst_status === 'unregistered' && !hasGstin) {
    return (
      <div>
        <PageHeader title="GST" description="Goods and Services Tax" />
        <AlertBanner
          type="info"
          title="GST Not Applicable"
          message="This entity is not registered under GST. Add a GSTIN in Settings → GST to enable the GST Command Center."
        />
      </div>
    );
  }

  const midYearDate = getGSTMidYearDate(company);
  const gstin = company.gst_details?.gstin;
  const state = company.entity_details?.state || 'Not configured';
  const isComposition = company.gst_status === 'composition';

  return (
    <div className="space-y-5">
      <PageHeader title="GST Command Center" description="Compliance dashboard, returns, and filing management" />

      {/* ── GSTIN Profile Banner ── */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100/30" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-slate-100/40" />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200/50">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">GSTIN</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isComposition ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isComposition ? 'Composition' : 'Regular'}
                </span>
              </div>
              {gstin ? (
                <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-gray-900">{gstin}</p>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-gray-400">Not configured</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {/* Shared taxpayer session — connect once, every GST module reuses it (no repeat OTP). */}
            <GstConnectButton />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:justify-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">State</p>
                <p className="mt-0.5 font-semibold text-gray-700">{state}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Scheme</p>
                <p className="mt-0.5 font-semibold text-gray-700">
                  {isComposition ? `Composition (${company.gst_details?.compositionRate || 1}%)` : 'Regular'}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Entity</p>
                <p className="mt-0.5 max-w-[16rem] truncate font-semibold text-gray-700" title={company.name}>{company.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {midYearDate && (
        <AlertBanner
          type="warning"
          title="Mid-Year GST Registration"
          message={`This entity was registered under GST on ${midYearDate}, which is after the financial year start. GST computations will only include transactions from the registration date onwards.`}
        />
      )}
      {isComposition && (
        <AlertBanner
          type="info"
          title="Composition Scheme"
          message={`This entity is under the GST Composition Scheme (Rate: ${company.gst_details?.compositionRate || 1}%). ITC is not available under composition scheme.`}
        />
      )}

      {/* ── Current Period Summary — KPI Widgets ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Period Summary</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">{fy.label}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-125" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    {kpi.icon}
                  </div>
                  <TrendBadge trend={kpi.trend} label={kpi.trendLabel} />
                </div>
                <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-gray-900">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly / Quarterly Compliance ── */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Monthly / Quarterly Compliance</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {complianceModules.map((m) => (
            <ModuleCard key={m.href} companyId={companyId} {...m} statusChip={m.href === 'gst/gstr1' ? gstr1FiledChip : undefined} />
          ))}
        </div>
      </div>

      {/* ── Core Systems & Annuals ── */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Core Systems & Annuals</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coreModules.map((m) => (
            <ModuleCard key={m.href} companyId={companyId} {...m} />
          ))}
        </div>
      </div>
    </div>
  );
}

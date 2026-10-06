import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { lazyPage, registerPrefetchRoutes } from '@/lib/routePrefetch';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { hasLocalSignIn } from '@/lib/authGate';

// Layouts
const CompanyLayout = lazyPage(() => import('@/app/company/[id]/layout').then(m => ({ default: m.default })));

// Top-level pages
const AuthPage = lazyPage(() => import('@/app/auth/page').then(m => ({ default: m.default })));
const CompaniesPage = lazyPage(() => import('@/app/companies/page').then(m => ({ default: m.default })));
const CreateCompanyPage = lazyPage(() => import('@/app/companies/create/page').then(m => ({ default: m.default })));
const MigrateLedgerNamesPage = lazyPage(() => import('@/app/dev/migrate-ledger-names/page').then(m => ({ default: m.default })));
const CoaAuditPage = lazyPage(() => import('./app/dev/coa-audit/page').then(m => ({ default: m.default })));
const AvatarPlaygroundPage = lazyPage(() => import('@/app/dev/avatar/page').then(m => ({ default: m.default })));
const NotFoundPage = lazyPage(() => import('@/app/not-found').then(m => ({ default: m.default })));

// Company pages
const CompanyOverviewPage = lazyPage(() => import('@/app/company/[id]/page').then(m => ({ default: m.default })));
const JournalPage = lazyPage(() => import('@/app/company/[id]/journal/page').then(m => ({ default: m.default })));
const CashBookPage = lazyPage(() => import('@/app/company/[id]/cash-book/page').then(m => ({ default: m.default })));

const TrialBalancePage = lazyPage(() => import('@/app/company/[id]/trial-balance/page').then(m => ({ default: m.default })));
const TradingAccountPage = lazyPage(() => import('@/app/company/[id]/trading-account/page').then(m => ({ default: m.default })));
const ProfitLossPage = lazyPage(() => import('@/app/company/[id]/profit-loss/page').then(m => ({ default: m.default })));
const PLAppropriationPage = lazyPage(() => import('@/app/company/[id]/pl-appropriation/page').then(m => ({ default: m.default })));
const BalanceSheetPage = lazyPage(() => import('@/app/company/[id]/balance-sheet/page').then(m => ({ default: m.default })));
const CashFlowPage = lazyPage(() => import('@/app/company/[id]/cash-flow/page').then(m => ({ default: m.default })));
const FundsFlowPage = lazyPage(() => import('@/app/company/[id]/funds-flow/page').then(m => ({ default: m.default })));
const IncomeExpenditurePage = lazyPage(() => import('@/app/company/[id]/income-expenditure/page').then(m => ({ default: m.default })));
const ReceiptsPaymentsPage = lazyPage(() => import('@/app/company/[id]/receipts-payments/page').then(m => ({ default: m.default })));
const LedgerPage = lazyPage(() => import('@/app/company/[id]/ledger/page').then(m => ({ default: m.default })));
const PurchaseRegisterPage = lazyPage(() => import('@/app/company/[id]/purchase-register/page').then(m => ({ default: m.default })));
const SalesRegisterPage = lazyPage(() => import('@/app/company/[id]/sales-register/page').then(m => ({ default: m.default })));
const PurchaseReturnsPage = lazyPage(() => import('@/app/company/[id]/purchase-returns/page').then(m => ({ default: m.default })));
const SalesReturnsPage = lazyPage(() => import('@/app/company/[id]/sales-returns/page').then(m => ({ default: m.default })));
const BillsReceivablePage = lazyPage(() => import('@/app/company/[id]/bills-receivable/page').then(m => ({ default: m.default })));
const BillsPayablePage = lazyPage(() => import('@/app/company/[id]/bills-payable/page').then(m => ({ default: m.default })));
const DebtorsPage = lazyPage(() => import('@/app/company/[id]/debtors/page').then(m => ({ default: m.default })));
const CreditorsPage = lazyPage(() => import('@/app/company/[id]/creditors/page').then(m => ({ default: m.default })));
const PartnersCapitalPage = lazyPage(() => import('@/app/company/[id]/partners-capital/page').then(m => ({ default: m.default })));
const RevaluationPage = lazyPage(() => import('@/app/company/[id]/revaluation/page').then(m => ({ default: m.default })));
const RealisationPage = lazyPage(() => import('@/app/company/[id]/realisation/page').then(m => ({ default: m.default })));
const ShareCapitalPage = lazyPage(() => import('@/app/company/[id]/share-capital/page').then(m => ({ default: m.default })));
const DebenturesPage = lazyPage(() => import('@/app/company/[id]/debentures/page').then(m => ({ default: m.default })));
const KartaCapitalPage = lazyPage(() => import('@/app/company/[id]/karta-capital/page').then(m => ({ default: m.default })));
const FundAccountsPage = lazyPage(() => import('@/app/company/[id]/fund-accounts/page').then(m => ({ default: m.default })));
const IncompleteRecordsPage = lazyPage(() => import('@/app/company/[id]/incomplete-records/page').then(m => ({ default: m.default })));
const MemberRegisterPage = lazyPage(() => import('@/app/company/[id]/member-register/page').then(m => ({ default: m.default })));
const FixedAssetsPage = lazyPage(() => import('@/app/company/[id]/fixed-assets/page').then(m => ({ default: m.default })));
const InvestmentsPage = lazyPage(() => import('@/app/company/[id]/investments/page').then(m => ({ default: m.default })));
const LoansPage = lazyPage(() => import('@/app/company/[id]/loans/page').then(m => ({ default: m.default })));
const DepreciationPage = lazyPage(() => import('@/app/company/[id]/depreciation/page').then(m => ({ default: m.default })));
const GstPage = lazyPage(() => import('@/app/company/[id]/gst/page').then(m => ({ default: m.default })));
const Gstr1Page = lazyPage(() => import('@/app/company/[id]/gst/gstr1/page').then(m => ({ default: m.default })));
const Gstr3bPage = lazyPage(() => import('@/app/company/[id]/gst/gstr3b/page').then(m => ({ default: m.default })));
const ItcRegisterPage = lazyPage(() => import('@/app/company/[id]/gst/itc-register/page').then(m => ({ default: m.default })));
const LedgersPage = lazyPage(() => import('@/app/company/[id]/gst/ledgers/page').then(m => ({ default: m.default })));
const EwayBillPage = lazyPage(() => import('@/app/company/[id]/gst/eway-bill/page').then(m => ({ default: m.default })));
const GstBooksBridgePage = lazyPage(() => import('@/app/company/[id]/gst/books-bridge/page').then(m => ({ default: m.default })));
const GstSearchPage = lazyPage(() => import('@/app/company/[id]/gst/search/page').then(m => ({ default: m.default })));
const EInvoicingPage = lazyPage(() => import('@/app/company/[id]/gst/e-invoicing/page').then(m => ({ default: m.default })));
const Gstr9Page = lazyPage(() => import('@/app/company/[id]/gst/annuals/page').then(m => ({ default: m.default })));
const Gstr2aPage = lazyPage(() => import('@/app/company/[id]/gst/gstr2a/page').then(m => ({ default: m.default })));
const Gstr2bPage = lazyPage(() => import('@/app/company/[id]/gst/gstr2b/page').then(m => ({ default: m.default })));
const Gstr1AnnualPage = lazyPage(() => import('@/app/company/[id]/gst/gstr1-annual/page').then(m => ({ default: m.default })));
const IncomeTaxPage = lazyPage(() => import('@/app/company/[id]/income-tax/page').then(m => ({ default: m.default })));
const TdsRegisterPage = lazyPage(() => import('@/app/company/[id]/tds-register/page').then(m => ({ default: m.default })));
const TcsRegisterPage = lazyPage(() => import('@/app/company/[id]/tcs-register/page').then(m => ({ default: m.default })));
const AdvanceTaxPage = lazyPage(() => import('@/app/company/[id]/advance-tax/page').then(m => ({ default: m.default })));
const DeferredTaxPage = lazyPage(() => import('@/app/company/[id]/deferred-tax/page').then(m => ({ default: m.default })));
const BrsPage = lazyPage(() => import('@/app/company/[id]/brs/page').then(m => ({ default: m.default })));
const AuditPage = lazyPage(() => import('@/app/company/[id]/audit/page').then(m => ({ default: m.default })));
const FcraPage = lazyPage(() => import('@/app/company/[id]/fcra/page').then(m => ({ default: m.default })));
const ApplicationCheckPage = lazyPage(() => import('@/app/company/[id]/application-check/page').then(m => ({ default: m.default })));
const Form10bPage = lazyPage(() => import('@/app/company/[id]/form-10b/page').then(m => ({ default: m.default })));
const LlpFormsPage = lazyPage(() => import('@/app/company/[id]/llp-forms/page').then(m => ({ default: m.default })));
const SegmentReportingPage = lazyPage(() => import('@/app/company/[id]/segment-reporting/page').then(m => ({ default: m.default })));
const RelatedPartyPage = lazyPage(() => import('@/app/company/[id]/related-party/page').then(m => ({ default: m.default })));
const AccountingPoliciesPage = lazyPage(() => import('@/app/company/[id]/accounting-policies/page').then(m => ({ default: m.default })));
const AsChecklistPage = lazyPage(() => import('@/app/company/[id]/as-checklist/page').then(m => ({ default: m.default })));
const ContingentLiabilitiesPage = lazyPage(() => import('@/app/company/[id]/contingent-liabilities/page').then(m => ({ default: m.default })));
const DirectorsReportPage = lazyPage(() => import('@/app/company/[id]/directors-report/page').then(m => ({ default: m.default })));
const CAROPage = lazyPage(() => import('@/app/company/[id]/caro/page').then(m => ({ default: m.default })));
const CostRecordsPage = lazyPage(() => import('@/app/company/[id]/cost-records/page').then(m => ({ default: m.default })));
const FormNPage = lazyPage(() => import('@/app/company/[id]/form-n/page').then(m => ({ default: m.default })));
const InventoryPage = lazyPage(() => import('@/app/company/[id]/inventory/page').then(m => ({ default: m.default })));

const RatioAnalysisPage = lazyPage(() => import('@/app/company/[id]/ratio-analysis/page').then(m => ({ default: m.default })));
const BSNotesPage = lazyPage(() => import('@/app/company/[id]/bs-notes/page').then(m => ({ default: m.default })));

const InventoryItemsPage = lazyPage(() => import('@/app/company/[id]/inventory/items/page').then(m => ({ default: m.default })));
const BinCardPage = lazyPage(() => import('@/app/company/[id]/inventory/bin-card/page').then(m => ({ default: m.default })));
const StoresLedgerPage = lazyPage(() => import('@/app/company/[id]/inventory/stores-ledger/page').then(m => ({ default: m.default })));
const CostSheetPage = lazyPage(() => import('@/app/company/[id]/inventory/cost-sheet/page').then(m => ({ default: m.default })));
const PayrollPage = lazyPage(() => import('@/app/company/[id]/payroll/page').then(m => ({ default: m.default })));
const FoldersPage = lazyPage(() => import('@/app/company/[id]/folders/page').then(m => ({ default: m.default })));
const BulkWorkspacePage = lazyPage(() => import('@/app/company/[id]/bulk-workspace/page').then(m => ({ default: m.default })));
const BankImportPage = lazyPage(() => import('@/app/company/[id]/bank-import/page').then(m => ({ default: m.default })));
const TallyViewerPage = lazyPage(() => import('@/app/company/[id]/tally/page').then(m => ({ default: m.default })));
const ErpBridgePage = lazyPage(() => import('@/app/company/[id]/erp-bridge/page').then(m => ({ default: m.default })));
const BankAccountsPage = lazyPage(() => import('@/app/company/[id]/bank-accounts/page').then(m => ({ default: m.default })));
const SettingsPage = lazyPage(() => import('@/app/company/[id]/settings/page').then(m => ({ default: m.default })));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Gate an in-app route behind the login screen. With Supabase configured the
 *  real session decides; offline, the flag the login screen sets stands in.
 *  Not signed in — including a deep link straight to a page — bounces to /auth. */
function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'in' | 'out'>(
    () => (isSupabaseConfigured ? 'checking' : hasLocalSignIn() ? 'in' : 'out'),
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setState(data.session ? 'in' : 'out'); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (active) setState(session ? 'in' : 'out'); });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === 'checking') return <PageLoader />;
  if (state === 'out') return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/** A lazy page wrapped in Suspense and the login gate. */
const guarded = (page: ReactNode) => (
  <RequireAuth><Suspense fallback={<PageLoader />}>{page}</Suspense></RequireAuth>
);

export const router = createBrowserRouter([
  // ── LOGIN ACTIVE ──────────────────────────────────────────────────────────────
  // The app opens on the login screen. Every in-app route is wrapped in
  // RequireAuth (via `guarded`), so a visitor who has not signed in — or who types
  // a deep link to any page — is bounced to /auth. "/" points at /companies, which
  // is itself guarded, so a fresh visit lands on the login screen. With Supabase
  // configured the real session gates; offline the login screen sets a local flag.
  { index: true, element: <Navigate to="/companies" replace /> },
  { path: '/auth', element: <Suspense fallback={<PageLoader />}><AuthPage /></Suspense> },
  { path: '/companies', element: guarded(<CompaniesPage />) },
  { path: '/companies/create', element: guarded(<CreateCompanyPage />) },
  { path: '/dev/migrate-ledger-names', element: <Suspense fallback={<PageLoader />}><MigrateLedgerNamesPage /></Suspense> },
  { path: '/dev/coa-audit', element: <Suspense fallback={<PageLoader />}><CoaAuditPage /></Suspense> },
  { path: '/dev/avatar', element: <Suspense fallback={<PageLoader />}><AvatarPlaygroundPage /></Suspense> },
  {
    path: '/company/:id',
    element: guarded(<CompanyLayout />),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><CompanyOverviewPage /></Suspense> },
      { path: 'journal', element: <Suspense fallback={<PageLoader />}><JournalPage /></Suspense> },
      { path: 'cash-book', element: <Suspense fallback={<PageLoader />}><CashBookPage /></Suspense> },

      { path: 'trial-balance', element: <Suspense fallback={<PageLoader />}><TrialBalancePage /></Suspense> },
      { path: 'trading-account', element: <Suspense fallback={<PageLoader />}><TradingAccountPage /></Suspense> },
      { path: 'profit-loss', element: <Suspense fallback={<PageLoader />}><ProfitLossPage /></Suspense> },
      { path: 'pl-appropriation', element: <Suspense fallback={<PageLoader />}><PLAppropriationPage /></Suspense> },
      { path: 'balance-sheet', element: <Suspense fallback={<PageLoader />}><BalanceSheetPage /></Suspense> },
      { path: 'cash-flow', element: <Suspense fallback={<PageLoader />}><CashFlowPage /></Suspense> },
      { path: 'funds-flow', element: <Suspense fallback={<PageLoader />}><FundsFlowPage /></Suspense> },

      { path: 'ratio-analysis', element: <Suspense fallback={<PageLoader />}><RatioAnalysisPage /></Suspense> },
      { path: 'bs-notes', element: <Suspense fallback={<PageLoader />}><BSNotesPage /></Suspense> },
      { path: 'income-expenditure', element: <Suspense fallback={<PageLoader />}><IncomeExpenditurePage /></Suspense> },
      { path: 'receipts-payments', element: <Suspense fallback={<PageLoader />}><ReceiptsPaymentsPage /></Suspense> },
      { path: 'ledger', element: <Suspense fallback={<PageLoader />}><LedgerPage /></Suspense> },
      { path: 'purchase-register', element: <Suspense fallback={<PageLoader />}><PurchaseRegisterPage /></Suspense> },
      { path: 'sales-register', element: <Suspense fallback={<PageLoader />}><SalesRegisterPage /></Suspense> },
      { path: 'purchase-returns', element: <Suspense fallback={<PageLoader />}><PurchaseReturnsPage /></Suspense> },
      { path: 'sales-returns', element: <Suspense fallback={<PageLoader />}><SalesReturnsPage /></Suspense> },
      { path: 'bills-receivable', element: <Suspense fallback={<PageLoader />}><BillsReceivablePage /></Suspense> },
      { path: 'bills-payable', element: <Suspense fallback={<PageLoader />}><BillsPayablePage /></Suspense> },
      { path: 'debtors', element: <Suspense fallback={<PageLoader />}><DebtorsPage /></Suspense> },
      { path: 'creditors', element: <Suspense fallback={<PageLoader />}><CreditorsPage /></Suspense> },
      { path: 'partners-capital', element: <Suspense fallback={<PageLoader />}><PartnersCapitalPage /></Suspense> },
      { path: 'revaluation', element: <Suspense fallback={<PageLoader />}><RevaluationPage /></Suspense> },
      { path: 'realisation', element: <Suspense fallback={<PageLoader />}><RealisationPage /></Suspense> },
      { path: 'share-capital', element: <Suspense fallback={<PageLoader />}><ShareCapitalPage /></Suspense> },
      { path: 'debentures', element: <Suspense fallback={<PageLoader />}><DebenturesPage /></Suspense> },
      { path: 'karta-capital', element: <Suspense fallback={<PageLoader />}><KartaCapitalPage /></Suspense> },
      { path: 'fund-accounts', element: <Suspense fallback={<PageLoader />}><FundAccountsPage /></Suspense> },
      { path: 'incomplete-records', element: <Suspense fallback={<PageLoader />}><IncompleteRecordsPage /></Suspense> },
      { path: 'member-register', element: <Suspense fallback={<PageLoader />}><MemberRegisterPage /></Suspense> },
      { path: 'fixed-assets', element: <Suspense fallback={<PageLoader />}><FixedAssetsPage /></Suspense> },
      { path: 'investments', element: <Suspense fallback={<PageLoader />}><InvestmentsPage /></Suspense> },
      { path: 'loans', element: <Suspense fallback={<PageLoader />}><LoansPage /></Suspense> },
      { path: 'depreciation', element: <Suspense fallback={<PageLoader />}><DepreciationPage /></Suspense> },
      { path: 'gst', element: <Suspense fallback={<PageLoader />}><GstPage /></Suspense> },
      { path: 'gst/gstr1', element: <Suspense fallback={<PageLoader />}><Gstr1Page /></Suspense> },
      { path: 'gst/search', element: <Suspense fallback={<PageLoader />}><GstSearchPage /></Suspense> },
      { path: 'gst/e-invoicing', element: <Suspense fallback={<PageLoader />}><EInvoicingPage /></Suspense> },
      { path: 'gst/annuals', element: <Suspense fallback={<PageLoader />}><Gstr9Page /></Suspense> },
      { path: 'gst/gstr2a', element: <Suspense fallback={<PageLoader />}><Gstr2aPage /></Suspense> },
      { path: 'gst/gstr2b', element: <Suspense fallback={<PageLoader />}><Gstr2bPage /></Suspense> },
      { path: 'gst/gstr1-annual', element: <Suspense fallback={<PageLoader />}><Gstr1AnnualPage /></Suspense> },
      { path: 'gst/gstr3b', element: <Suspense fallback={<PageLoader />}><Gstr3bPage /></Suspense> },
      { path: 'gst/itc-register', element: <Suspense fallback={<PageLoader />}><ItcRegisterPage /></Suspense> },
      { path: 'gst/ledgers', element: <Suspense fallback={<PageLoader />}><LedgersPage /></Suspense> },
      { path: 'gst/eway-bill', element: <Suspense fallback={<PageLoader />}><EwayBillPage /></Suspense> },
      { path: 'gst/books-bridge', element: <Suspense fallback={<PageLoader />}><GstBooksBridgePage /></Suspense> },
      { path: 'income-tax', element: <Suspense fallback={<PageLoader />}><IncomeTaxPage /></Suspense> },
      { path: 'tds-register', element: <Suspense fallback={<PageLoader />}><TdsRegisterPage /></Suspense> },
      { path: 'tcs-register', element: <Suspense fallback={<PageLoader />}><TcsRegisterPage /></Suspense> },
      { path: 'advance-tax', element: <Suspense fallback={<PageLoader />}><AdvanceTaxPage /></Suspense> },
      { path: 'deferred-tax', element: <Suspense fallback={<PageLoader />}><DeferredTaxPage /></Suspense> },

      { path: 'brs', element: <Suspense fallback={<PageLoader />}><BrsPage /></Suspense> },
      { path: 'audit', element: <Suspense fallback={<PageLoader />}><AuditPage /></Suspense> },
      { path: 'fcra', element: <Suspense fallback={<PageLoader />}><FcraPage /></Suspense> },
      { path: 'application-check', element: <Suspense fallback={<PageLoader />}><ApplicationCheckPage /></Suspense> },
      { path: 'form-10b', element: <Suspense fallback={<PageLoader />}><Form10bPage /></Suspense> },
      { path: 'llp-forms', element: <Suspense fallback={<PageLoader />}><LlpFormsPage /></Suspense> },
      { path: 'segment-reporting', element: <Suspense fallback={<PageLoader />}><SegmentReportingPage /></Suspense> },
      { path: 'related-party', element: <Suspense fallback={<PageLoader />}><RelatedPartyPage /></Suspense> },
      { path: 'accounting-policies', element: <Suspense fallback={<PageLoader />}><AccountingPoliciesPage /></Suspense> },
      { path: 'as-checklist', element: <Suspense fallback={<PageLoader />}><AsChecklistPage /></Suspense> },
      { path: 'contingent-liabilities', element: <Suspense fallback={<PageLoader />}><ContingentLiabilitiesPage /></Suspense> },
      { path: 'directors-report', element: <Suspense fallback={<PageLoader />}><DirectorsReportPage /></Suspense> },
      { path: 'caro', element: <Suspense fallback={<PageLoader />}><CAROPage /></Suspense> },
      { path: 'cost-records', element: <Suspense fallback={<PageLoader />}><CostRecordsPage /></Suspense> },
      { path: 'form-n', element: <Suspense fallback={<PageLoader />}><FormNPage /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<PageLoader />}><InventoryPage /></Suspense> },
      { path: 'inventory/items', element: <Suspense fallback={<PageLoader />}><InventoryItemsPage /></Suspense> },
      { path: 'inventory/bin-card', element: <Suspense fallback={<PageLoader />}><BinCardPage /></Suspense> },
      { path: 'inventory/stores-ledger', element: <Suspense fallback={<PageLoader />}><StoresLedgerPage /></Suspense> },
      { path: 'inventory/cost-sheet', element: <Suspense fallback={<PageLoader />}><CostSheetPage /></Suspense> },
      { path: 'payroll', element: <Suspense fallback={<PageLoader />}><PayrollPage /></Suspense> },
      { path: 'folders', element: <Suspense fallback={<PageLoader />}><FoldersPage /></Suspense> },
      { path: 'bulk-workspace', element: <Suspense fallback={<PageLoader />}><BulkWorkspacePage /></Suspense> },
      { path: 'bank-import', element: <Suspense fallback={<PageLoader />}><BankImportPage /></Suspense> },
      { path: 'tally', element: <Suspense fallback={<PageLoader />}><TallyViewerPage /></Suspense> },
      { path: 'erp-bridge', element: <Suspense fallback={<PageLoader />}><ErpBridgePage /></Suspense> },
      { path: 'bank-accounts', element: <Suspense fallback={<PageLoader />}><BankAccountsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
      { path: 'ai', element: <Navigate to=".." replace /> },
    ],
  },
  { path: '*', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
]);

// Lets nav links prefetch a page on hover/focus (src/lib/routePrefetch.ts).
registerPrefetchRoutes(router.routes);

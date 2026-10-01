import type { SalesTotals, PurchaseTotals, DocumentMode } from '../types';
import { inr } from '../ui';

interface SalesSummaryProps {
  kind: 'sales';
  totals: SalesTotals;
  mode: DocumentMode;
}

interface PurchaseSummaryProps {
  kind: 'purchase';
  totals: PurchaseTotals;
  mode: DocumentMode;
}

type SummarySectionProps = SalesSummaryProps | PurchaseSummaryProps;

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`yk-sum-row ${muted ? 'muted' : ''}`}>
      <span>{label}</span>
      <span className="num">{inr(value)}</span>
    </div>
  );
}

/** Bill summary — displays the totals the wizard state already computed. */
export function SummarySection(props: SummarySectionProps) {
  const { totals } = props;
  const isSales = props.kind === 'sales';
  const sales = isSales ? (props.totals as SalesTotals) : null;
  return (
    <div className="yk-sum" data-testid="bill-summary">
      <Row label="Taxable value" value={totals.taxable} />
      {totals.isIntra ? (
        <>
          <Row label="CGST" value={totals.cgst} />
          <Row label="SGST" value={totals.sgst} />
        </>
      ) : (
        <Row label="IGST" value={totals.igst} />
      )}
      {sales && sales.cess > 0 && <Row label="Cess" value={sales.cess} />}
      {sales && <Row label="Round-off" value={sales.roundOff} muted />}
      <div className="yk-sum-total">
        <span>Total</span>
        <span className="num" data-testid="bill-total">₹ {inr(totals.total)}</span>
      </div>
      {sales?.amountInWords && <p className="yk-sum-words">{sales.amountInWords}</p>}
    </div>
  );
}

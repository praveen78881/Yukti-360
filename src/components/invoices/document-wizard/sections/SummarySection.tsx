import type { SalesTotals, PurchaseTotals, DocumentMode } from '../types';

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

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Right column of the "Payment & routing" paygrid — the summary box. */
export function SummarySection(props: SummarySectionProps) {
  if (props.kind === 'sales') {
    const { totals } = props;
    return (
      <div className="sumbox">
        <div className="hd">Summary</div>
        <div className="sr"><span>Taxable</span><span>{inr(totals.taxable)}</span></div>
        {totals.isIntra ? (
          <>
            <div className="sr"><span>CGST</span><span>{inr(totals.cgst)}</span></div>
            <div className="sr"><span>SGST</span><span>{inr(totals.sgst)}</span></div>
          </>
        ) : (
          <div className="sr"><span>IGST</span><span>{inr(totals.igst)}</span></div>
        )}
        {totals.cess > 0 && (
          <div className="sr"><span>Cess</span><span>{inr(totals.cess)}</span></div>
        )}
        <div className="sr off"><span>Round-off</span><span>{inr(totals.roundOff)}</span></div>
        <div className="sr tot"><span>Total</span><span>₹ {inr(totals.total)}</span></div>
        {totals.amountInWords && <div className="swords">{totals.amountInWords}</div>}
      </div>
    );
  }

  // Purchase summary
  const { totals } = props;
  return (
    <div className="sumbox">
      <div className="hd">Summary</div>
      <div className="sr"><span>Taxable</span><span>{inr(totals.taxable)}</span></div>
      {totals.isIntra ? (
        <>
          <div className="sr"><span>CGST</span><span>{inr(totals.cgst)}</span></div>
          <div className="sr"><span>SGST</span><span>{inr(totals.sgst)}</span></div>
        </>
      ) : (
        <div className="sr"><span>IGST</span><span>{inr(totals.igst)}</span></div>
      )}
      <div className="sr tot"><span>Total</span><span>₹ {inr(totals.total)}</span></div>
    </div>
  );
}

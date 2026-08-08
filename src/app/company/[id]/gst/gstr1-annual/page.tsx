import { PageHeader } from '@/components/layout/PageHeader';
import { Gstr1PortalImport } from '@/components/gst/Gstr1PortalImport';

export default function Gstr1AnnualPage() {
  return (
    <div>
      <PageHeader
        title="GSTR-1 — Annual (filed data)"
        description="Import every month of a financial year as filed on the portal, review month-wise, and export the whole year to Excel"
      />
      <Gstr1PortalImport />
    </div>
  );
}

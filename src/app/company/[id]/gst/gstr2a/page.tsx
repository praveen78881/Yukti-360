import { PageHeader } from '@/components/layout/PageHeader';
import { GstReturnDownloader } from '@/components/gst/GstReturnDownloader';

export default function GSTR2APage() {
  return (
    <div>
      <PageHeader
        title="GSTR-2A"
        description="Auto-drafted inward supplies from supplier filings — download from the portal, view invoice-wise, export to Excel"
      />
      <GstReturnDownloader type="GSTR2A" />
    </div>
  );
}

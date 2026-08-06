import { PageHeader } from '@/components/layout/PageHeader';
import { GstReturnDownloader } from '@/components/gst/GstReturnDownloader';

export default function GSTR2BPage() {
  return (
    <div>
      <PageHeader
        title="GSTR-2B"
        description="Static monthly ITC statement — download from the portal, view invoice-wise, export to Excel"
      />
      <GstReturnDownloader type="GSTR2B" />
    </div>
  );
}

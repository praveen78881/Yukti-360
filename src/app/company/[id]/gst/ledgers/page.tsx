import { PageHeader } from '@/components/layout/PageHeader';
import { LedgersPanel } from '@/components/gst/LedgersPanel';

export default function LedgersPage() {
  return (
    <div>
      <PageHeader
        title="Electronic Ledgers"
        description="Cash, Input Tax Credit (ITC) and Liability ledgers — pulled live from the GST portal using your active session. Cached once downloaded."
      />
      <LedgersPanel />
    </div>
  );
}

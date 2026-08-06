'use client';

import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { GstinSearchTool } from '@/components/gst/GstinSearchTool';

export default function GstSearchPage() {
  const { company, loading } = useCompany();
  const ownGstin = (company?.gst_details?.gstin || '').trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Search / Verify GSTIN"
        description="Live taxpayer lookup from the GST portal via the Sandbox API — verify any GSTIN and export the result"
      />
      <GstinSearchTool defaultGstin={ownGstin} />
    </div>
  );
}

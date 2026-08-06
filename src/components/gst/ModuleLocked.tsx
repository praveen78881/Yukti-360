import { LockKeyhole, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

/** Full-page lock screen for GST modules that are gated until a launch date. */
export function ModuleLocked({ title, description, opensOn = '31 October 2026' }: {
  title: string;
  description: string;
  opensOn?: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex items-center justify-center py-14">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50">
            <LockKeyhole className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title} is locked</h2>
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            <CalendarClock className="h-4 w-4" /> Opens on {opensOn}
          </p>
          <p className="mt-4 text-xs text-gray-400">This module will be available from the date above. No action is needed until then.</p>
        </div>
      </div>
    </div>
  );
}

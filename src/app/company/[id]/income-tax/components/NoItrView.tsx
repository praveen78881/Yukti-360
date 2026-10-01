'use client';

/* Shown when the company's legal form has no ITR mapped in ENTITY_FORMS. */
import { FileX2 } from 'lucide-react';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';

export function NoItrView({ entityType }: { entityType?: EntityType }) {
  const label = entityType ? ENTITY_TYPES[entityType]?.label ?? entityType : 'this entity';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 mb-4">
        <FileX2 className="h-5 w-5 text-slate-400" />
      </div>
      <h2 className="text-sm font-bold text-slate-700">No ITR mapped for {label}</h2>
      <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
        Set the company&apos;s entity type in Settings, or add a mapping in
        <code className="mx-1 px-1 py-0.5 rounded bg-slate-100 text-slate-600">income-tax/lib/itrForms.ts</code>.
      </p>
    </div>
  );
}

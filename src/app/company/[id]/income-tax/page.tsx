'use client';

/* ─────────────────────────────────────────────────────────────────────────────
   Income Tax — ITR workspace (A.Y. 2026-27)

   Deliberately chrome-free: no page heading, no assessment-year caption, no
   due-date strip. The Yukti build carries its own header (form name, A.Y.,
   Open/Save/Export), so anything the shell drew above it was duplication that
   only stole vertical space. The form fills the content area edge to edge and
   reflows when the sidebar collapses.

   Everything here stays small and split:
     lib/itrForms.ts        entity -> form routing, form catalogue, URLs
     lib/itrBridge.ts       eval bridge into the frame's global scope
     lib/itrPersistence.ts  draft snapshot / restore into entity_data
     lib/itrPrefill.ts      identity prefill from the company master
     components/ItrFrame    the iframe host, sizing + autosave
     components/ItrTabs     form selector (hidden for single-form entities)
     components/NoItrView   unmapped-entity state
   ──────────────────────────────────────────────────────────────────────────── */
import { useMemo, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { formsForEntity, type ItrKey } from './lib/itrForms';
import { ItrFrame } from './components/ItrFrame';
import { NoItrView } from './components/NoItrView';

export default function IncomeTaxPage() {
  const { company, companyId, loading } = useCompany();
  const forms = useMemo(() => formsForEntity(company?.entity_type), [company?.entity_type]);
  const [active, setActive] = useState<ItrKey | null>(null);

  if (loading) return <div className="p-4 text-xs text-slate-500">Loading…</div>;
  if (!company || !companyId) return <div className="p-4 text-xs text-slate-500">Company not found.</div>;
  if (forms.length === 0) return <NoItrView entityType={company.entity_type} />;

  // The return chosen at creation (Settings → General can change it). When one is
  // set the page opens straight on it with no form switcher; otherwise every
  // allowed form is offered and the first is the default, as before.
  const saved = company.entity_details?.itrForm;
  const chosen = saved && forms.includes(saved) ? saved : null;
  const offered = chosen ? [chosen] : forms;
  const current = active && offered.includes(active) ? active : offered[0];

  return (
    <ItrFrame
      companyId={companyId}
      company={company}
      itrKey={current}
      forms={offered}
      onSelect={setActive}
    />
  );
}

/**
 * CARP Tools — Company & Entity Data (8 tools)
 *
 * These give the agent FULL read/write/edit/delete access to every page's data.
 * Most module pages (partners-capital, share-capital, audit, income-tax, registers,
 * schedule-iii, …) persist under entity_data as (module, section) → data. The tools
 * below take an OPTIONAL `module` so the AI can reach ANY page for ANY entity type,
 * and default the module to the company's entity_type when not given. Use
 * `list_entity_modules` to discover exactly where a page's data lives.
 */

import {
  getCompany,
  getEntityData,
  upsertEntityData,
  deleteEntityData,
  listAllEntityData,
  updateCompany,
  listBookPeriods,
} from '@/lib/offlineDb';
import type { ToolDeclaration, ToolResult, ToolExecutor } from './types';

/* ── Helpers ── */

/** Resolve the entity_data module: explicit wins, else the company's entity_type,
 *  else 'pvt_ltd' as a last resort (legacy default). */
function resolveModule(companyId: string, explicit?: unknown): string {
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const company = getCompany(companyId);
  return company?.entity_type || 'pvt_ltd';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge patch into base: nested plain objects merge recursively; arrays and
 *  primitives from the patch REPLACE the base. Preserves sibling fields so a partial
 *  edit never clobbers the rest of a page's data. */
function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out;
}

/* ── Declarations ── */

export const companyDeclarations: ToolDeclaration[] = [
  {
    name: 'get_company_info',
    description: 'Get the current company details including entity type, GST status, PAN, address, share capital, and all configuration.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_entity_data',
    description: 'Read a page/section of entity data for the current company. Works for ANY page. `section` is the data key (e.g. classification, compliance_calendar, registers, audit, schedule_iii, ai_rules, or an ITR form like itr6). `module` is optional — omit it to use the company\'s entity type automatically; pass it (e.g. "settings", "itr_ay2627") to target a specific store. Use list_entity_modules first if unsure where a page lives.',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Data section/key to fetch' },
        module: { type: 'string', description: 'Optional storage module (defaults to the company entity type). e.g. "settings", "itr_ay2627", "pvt_ltd".' },
      },
      required: ['section'],
    },
  },
  {
    name: 'list_entity_modules',
    description: 'List every (module, section) key that has stored data for this company — i.e. every page/dataset that exists. Use this to discover exactly where a page\'s data lives before reading or writing it.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'update_entity_data',
    description: 'Create or edit a page/section of entity data for the current company. Works for ANY page. By default (merge=true) the fields you pass are merged into the existing data so other fields are preserved — ideal for editing one value or filling one part of a page. Set merge=false to REPLACE the whole section. `module` is optional (defaults to the company entity type).',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Data section/key to write' },
        data: { type: 'object', description: 'The fields to write (merged into existing unless merge=false)' },
        module: { type: 'string', description: 'Optional storage module (defaults to the company entity type)' },
        merge: { type: 'boolean', description: 'Merge into existing data (default true). false = replace the entire section.' },
      },
      required: ['section', 'data'],
    },
  },
  {
    name: 'delete_entity_data',
    description: 'Delete a page/section of entity data (destructive). Provide `section` to delete one section, or omit it to clear an entire `module`. `module` is optional (defaults to the company entity type). This is irreversible — the platform will ask the CA to confirm.',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section to delete. Omit to delete the whole module.' },
        module: { type: 'string', description: 'Optional storage module (defaults to the company entity type)' },
      },
    },
  },
  {
    name: 'update_company_settings',
    description: 'Update company-level settings/config a user can change in Settings: name, address, PAN, GSTIN, entity type, GST status, accounting method, financial year, tax audit flag, TDS/TCS applicability, inventory flag.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name' },
        address: { type: 'string', description: 'Registered address' },
        pan: { type: 'string', description: 'PAN (10 chars)' },
        gstin: { type: 'string', description: 'GSTIN (15 chars)' },
        entity_type: { type: 'string', description: 'Entity type key (e.g. pvt_ltd, partnership, trust, huf)' },
        gst_status: { type: 'string', description: 'unregistered | regular | composition' },
        tax_audit_applicable: { type: 'boolean' },
        accounting_method: { type: 'string', enum: ['mercantile', 'cash'] },
        financial_year_start: { type: 'string', description: 'april | july | january' },
        tds_applicable: { type: 'boolean' },
        tcs_applicable: { type: 'boolean' },
        inventory_enabled: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_ai_rules',
    description: 'Get the custom AI rules set by the CA for this company. These rules guide your behaviour.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_book_periods',
    description: 'Get all book/financial year periods for this company with their status (open/closed).',
    parameters: { type: 'object', properties: {} },
  },
];

/* ── Executors ── */

export const companyExecutors: Record<string, ToolExecutor> = {
  get_company_info(_args, companyId) {
    const company = getCompany(companyId);
    if (!company) return { success: false, error: 'Company not found' };
    return { success: true, data: company, displayType: 'json' };
  },

  get_entity_data(args, companyId) {
    const section = args.section as string;
    // Explicit module wins; else search entity-type module, then legacy 'pvt_ltd', then 'settings'.
    if (typeof args.module === 'string' && args.module.trim()) {
      const rec = getEntityData(companyId, args.module.trim(), section);
      return { success: true, data: rec?.data ?? null, displayType: rec ? 'json' : 'text' };
    }
    const entityModule = resolveModule(companyId);
    const record =
      getEntityData(companyId, entityModule, section) ||
      getEntityData(companyId, 'pvt_ltd', section) ||
      getEntityData(companyId, 'settings', section);
    if (!record) return { success: true, data: null, displayType: 'text' };
    return { success: true, data: record.data, displayType: 'json' };
  },

  list_entity_modules(_args, companyId) {
    const all = listAllEntityData(companyId);
    return { success: true, data: { count: all.length, sections: all }, displayType: 'table' };
  },

  update_entity_data(args, companyId) {
    const module = resolveModule(companyId, args.module);
    const section = args.section as string;
    const merge = args.merge !== false; // default true
    let next = args.data;
    if (merge) {
      const existing = getEntityData(companyId, module, section)?.data;
      if (existing !== undefined && existing !== null) next = deepMerge(existing, args.data);
    }
    upsertEntityData(companyId, module, section, next);
    return { success: true, data: { module, section, merged: merge, updated: true }, displayType: 'confirmation' };
  },

  delete_entity_data(args, companyId) {
    const module = resolveModule(companyId, args.module);
    const section = typeof args.section === 'string' && args.section.trim() ? args.section.trim() : undefined;
    deleteEntityData(companyId, module, section);
    return { success: true, data: { module, section: section ?? '(entire module)', deleted: true }, displayType: 'confirmation' };
  },

  update_company_settings(args, companyId) {
    const company = getCompany(companyId);
    if (!company) return { success: false, error: 'Company not found' };

    const updates: Record<string, unknown> = {};
    if (args.name) updates.name = args.name;
    if (args.entity_type) updates.entity_type = args.entity_type;
    if (args.gst_status) updates.gst_status = args.gst_status;
    if (args.tax_audit_applicable !== undefined) updates.tax_audit_applicable = args.tax_audit_applicable;
    if (args.accounting_method) updates.accounting_method = args.accounting_method;
    if (args.financial_year_start) updates.financial_year_start = args.financial_year_start;
    if (args.tds_applicable !== undefined) updates.tds_applicable = args.tds_applicable;
    if (args.tcs_applicable !== undefined) updates.tcs_applicable = args.tcs_applicable;
    if (args.inventory_enabled !== undefined) updates.inventory_enabled = args.inventory_enabled;

    // Nested detail fields
    if (args.address || args.pan) {
      updates.entity_details = {
        ...company.entity_details,
        ...(args.address ? { address: args.address } : {}),
        ...(args.pan ? { pan: args.pan } : {}),
      };
    }
    if (args.gstin) {
      updates.gst_details = { ...company.gst_details, gstin: args.gstin };
    }

    // updateCompany is async but offlineDb persists synchronously; fire-and-forget.
    updateCompany(companyId, updates);
    return { success: true, data: { updated: Object.keys(updates) }, displayType: 'confirmation' };
  },

  get_ai_rules(_args, companyId) {
    const record = getEntityData(companyId, 'settings', 'ai_rules');
    if (!record) return { success: true, data: { rules: null, message: 'No custom AI rules set. The CA can add rules in Settings → AI Rules.' }, displayType: 'text' };
    return { success: true, data: record.data, displayType: 'text' };
  },

  get_book_periods(_args, companyId) {
    const periods = listBookPeriods(companyId);
    return { success: true, data: periods, displayType: 'table' };
  },
};

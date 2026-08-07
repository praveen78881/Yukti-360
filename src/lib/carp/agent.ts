/**
 * CARP Agent — Gemini Integration
 *
 * Manages conversation state, sends messages to Gemini with
 * function-calling tools, and executes tool calls locally.
 */

import { CARP_TOOLS, executeTool, type ToolResult } from './tools';
import { toGeminiFunctionDeclarations } from './geminiSchema';
import { getUploadedWorkbook, getWorkbookSummary } from '@/lib/excelUpload';
import { getSuspenseTransactions } from '@/lib/bulk/bulkDb';
import { supabase } from '@/lib/supabaseClient';
import { buildEntityKnowledge } from './entityKnowledge';

const GEMINI_TOOLS = toGeminiFunctionDeclarations(CARP_TOOLS);
import { getEntityData } from '@/lib/offlineDb';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface CarpMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  timestamp: number;
  /** The model's reasoning summary for this turn (shown collapsibly in the UI) */
  thinking?: string;
  /** Tool calls the assistant wants to make */
  toolCalls?: ToolCall[];
  /** Results from tool execution */
  toolResults?: ToolResult[];
  /** Loading state */
  isLoading?: boolean;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ConfirmAction {
  toolName: string;
  summary: string;
  args: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════
   Write-tool confirmation
   ═══════════════════════════════════════════════════════ */

// Full-access posture: the AI performs reads/creates/edits with NO friction.
// Only DESTRUCTIVE actions (irreversible deletes) show a one-tap confirm card, plus
// bulk_move_to_ledger which the bulk-classifier flow deliberately confirms before it
// posts many rows. Everything else executes immediately.
const WRITE_TOOLS = new Set([
  'delete_journal_entry', 'bulk_delete_entries',
  'delete_entity_data',
  'bulk_move_to_ledger',
]);

function describeAction(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'create_journal_entry': {
      const lines = args.lines as unknown[] | undefined;
      return `Create journal entry — "${String(args.narration ?? '')}" (${lines?.length ?? 0} lines)`;
    }
    case 'bulk_create_entries': {
      const e = args.entries as unknown[] | undefined;
      return `Create ${e?.length ?? 0} journal entries`;
    }
    case 'delete_journal_entry':
      return `Delete journal entry — ID: ${String(args.entry_id ?? '')}`;
    case 'bulk_delete_entries': {
      const ids = args.entry_ids as string[] | undefined;
      return `Delete ${ids?.length ?? 0} journal entries`;
    }
    case 'update_journal_entry':
      return `Update journal entry — ID: ${String(args.entry_id ?? '')}`;
    case 'bulk_update_entries': {
      const u = args.updates as unknown[] | undefined;
      return `Update ${u?.length ?? 0} journal entries`;
    }
    case 'delete_entity_data':
      return `Delete page data — ${String(args.section ?? '(entire module)')}${args.module ? ` in ${String(args.module)}` : ''}`;
    case 'bulk_move_to_ledger':
      return `Move suspense rows matching "${String(args.keyword ?? '')}" to ledger`;
    case 'bulk_create_ledger':
      return `Create ledger account — ${String(args.name ?? '')} (${String(args.group ?? '')})`;
    case 'bulk_add_other_side':
      return `Add ₹${String(args.amount ?? '')} ${String(args.side ?? '')} to ledger`;
    case 'workspace_manage':
      return `Workspace: ${String(args.action ?? '')} — ${String(args.name ?? '')}`;
    case 'update_entity_data':
      return `Update entity data — section: ${String(args.section ?? '')}`;
    case 'update_settings':
      return `Update company settings`;
    default:
      return name.replace(/_/g, ' ');
  }
}

/* ═══════════════════════════════════════════════════════
   System Prompt
   ═══════════════════════════════════════════════════════ */

function buildSystemPrompt(companyName: string, entityType: string, companyId: string, aiRules?: string | null): string {
  let prompt = `You are Aleza — a highly skilled, fully autonomous AI accounting agent built for Indian Chartered Accountants, operating INSIDE this software with the same powers as a human user of the app.

You are currently working on: "${companyName}" (${entityType})

═══════════════════════════════════════════
FULL ACCESS — YOU CAN DO ANYTHING A USER CAN DO MANUALLY
═══════════════════════════════════════════
You have COMPLETE read, write, edit and delete access to every page, every dataset and every file in this software. Anything the user can do by clicking through the app, you can do by using your tools. You are not limited to a workspace — you operate on the real data behind every navigation page.

- JOURNAL / LEDGERS: create, read, update, delete, search, and bulk-create/update/delete journal entries; compute the ledger of any account and any balance.
- FINANCIAL STATEMENTS & TAX: compute trial balance, trading, P&L, balance sheet, cash flow, funds flow, ratios, P&L appropriation, cash book, COGS, GST (register/GSTR-1/GSTR-3B/ITC), TDS, taxable income, debtor/creditor ageing.
- ANY PAGE'S DATA (partners' capital, share capital, karta capital, debentures, fixed assets, depreciation, investments, loans, audit/CARO/directors' report, deferred/advance tax, contingent liabilities, related party, schedule III, income-tax/ITR, compliance calendar, registers, settings, and every other module page):
    • read_page_data — see what the user sees on a page.
    • list_entity_modules — DISCOVER exactly where a page's data is stored (its module + section keys). Use this whenever you're unsure where a page lives.
    • get_entity_data({ section, module? }) — read any page's stored data. Omit module to use this entity's default automatically; pass module (e.g. "settings", "itr_ay2627") to target a specific store.
    • update_entity_data({ section, data, module?, merge? }) — CREATE or EDIT any page's data. merge=true (default) patches your fields into the existing data (keeps everything else) — perfect for editing one value or filling part of a page. merge=false REPLACES the whole section.
    • delete_entity_data({ section?, module? }) — delete a page's data (or a whole module). Destructive → the platform shows a confirm card.
- FILES: create, read, EDIT (update_file), rename and delete workspace files (text, CSV, markdown, reports, spreadsheets).
- SETTINGS: edit company settings/config (name, PAN, GSTIN, entity type, GST status, accounting method, FY, TDS/TCS, inventory).
- Draft CA/legal documents, look up Indian statutes, validate entries, compute depreciation, navigate the user to any page.

═══════════════════════════════════════════
CROSS-PAGE WORK
═══════════════════════════════════════════
You can read data from one page and use it to fill another. Pattern: (1) read the SOURCE with read_page_data / get_entity_data / a compute tool, (2) transform it, (3) WRITE the TARGET with update_entity_data / create entries / update_company_settings, (4) optionally read it back to verify. If you don't know which module a page uses, call list_entity_modules first, then act. Chain as many steps as needed in one go.

═══════════════════════════════════════════
CHART OF ACCOUNTS — REUSE FIRST, CREATE ONLY IF MISSING
═══════════════════════════════════════════
Before creating or editing ANY journal entry, call get_chart_of_accounts. You MUST reuse an account that already exists (in this company's books or its custom accounts) with its EXACT name, group and nature — never invent a near-duplicate (don't add "Sales Revenue" if "Sales" already exists; don't add "Bank A/c" if "Bank" exists). Only when nothing suitable exists, call create_account with the correct Schedule III sub-group and nature from the master palette, THEN use that account. Names must be clean (no "A/c" suffix). Every entry MUST balance (Dr = Cr).

═══════════════════════════════════════════
FILLING A PAGE OR A SPECIFIC FIELD
═══════════════════════════════════════════
When the CA asks you to fill / enter / update something on a page or a specific field:
1. FIRST read the current state of that page/section (read_page_data, or get_entity_data; use list_entity_modules if you're unsure where the page's data lives) so you can see what fields exist and what is already filled.
2. Work out exactly which fields the request needs, and gather the values — from the source page/data the CA points you to, or by computing them.
3. WRITE only those fields (update_entity_data with merge=true so you never disturb the rest of the page; create_journal_entry / update_company_settings for those domains).
4. Read it back to confirm it landed.
You are editing the REAL data behind the page — the on-screen form/fields re-render from it, so filling the data fills the field.

═══════════════════════════════════════════
POSTURE — DO IT, DON'T DEFER
═══════════════════════════════════════════
- When the CA asks for something, DO IT with your tools immediately. You are an agent, not a chatbot. Never reply "I can't do that" or "please do it manually" for anything the app supports — you have a tool for it; if you're missing a detail, ask a brief question, otherwise act.
- You do NOT need to create a new file to make a change — edit the existing data/file in place (update_entity_data with merge, update_journal_entry, workspace update_file).
- The ONLY gate is a one-tap confirm card the platform shows for irreversible/destructive actions (deletes, full-section replace, bulk reclassify). That is a safety confirmation, not a refusal — proceed and let the card appear. If the CA cancels it (error "Action cancelled by CA."), acknowledge and ask what to change; never retry automatically.

RULES:
1. Indian accounting terminology (Dr./Cr., ₹). Do NOT append "A/c"/"a/c" to account names (use "Sales", "Customer") — the system appends "A/c" on display.
2. Journal entries MUST balance — total debits = total credits.
3. Use proper account groups (Current Assets, Fixed Assets, Current Liabilities, Revenue, etc.). Follow Indian GAAP / Ind AS as applicable.
4. All dates YYYY-MM-DD. Financial year is April–March.
5. Voucher types: JRN, SLS, PUR, RCT, PMT, CNT.
6. For compliance queries cite specific sections (e.g. "Sec 135 of Companies Act 2013").
7. SPEED RULE — for 2+ journal entries ALWAYS use bulk tools in a SINGLE call (bulk_create_entries / bulk_update_entries / bulk_delete_entries); never loop the single-entry tools.
8. Prefer merge=true when editing entity data so you never clobber unrelated fields; use merge=false only when the CA wants to replace an entire section.
9. Be concise. Report what you actually did (which pages/sections/entries you changed).`;

  // Entity-wise domain knowledge — tailors Aleza's reasoning (ITR form, tax/audit
  // profile, statement format, GST/TDS/TCS/depreciation, and the integration model)
  // to THIS entity type so it applies the right Indian rules.
  prompt += buildEntityKnowledge(entityType);

  // Bulk mode — inject specialised bulk system prompt when company has bulk data
  const hasBulkData = getSuspenseTransactions(companyId).length > 0;
  if (hasBulkData) {
    prompt += `

═══════════════════════════════════════════
BULK MODE — BANK STATEMENT CLASSIFIER
═══════════════════════════════════════════
This entity uses BULK BOOKKEEPING. Thousands of bank transactions sit in suspense.
Your job is to help the CA classify them into ledgers FAST.

BULK TOOLS AVAILABLE:
- bulk_extract_keywords: Get recurring keywords from unallocated suspense (call first)
- bulk_search_suspense: Count + total + 5 samples for a keyword (aggregates only)
- bulk_move_to_ledger: Bulk-move all matching rows after CA confirms (DB does the work)
- bulk_create_ledger: Create a new ledger inline
- bulk_add_other_side: Post GST portal/cash book other-side to party ledger
- bulk_get_progress: Check how many rows remain
- bulk_get_ledger_balance: Get DR/CR balance for any ledger
- bulk_list_ledgers: See all ledger accounts created

YOUR EXACT LOOP:
1. Call bulk_extract_keywords. Get the ranked keyword list.
2. Take the top keyword. Call bulk_search_suspense to get count + total + samples.
3. Present: "I see <KEYWORD> appears <count> times for ₹<total>. Samples: <narrations>. What are these / why paid?"
4. WAIT for the CA's answer.
5. Based on the answer, find/create the right ledger. Call bulk_move_to_ledger.
6. If the ledger is a supplier/customer, ask for the other side (GST portal / cash book) and call bulk_add_other_side.
7. Call bulk_get_progress, report remaining, show next keyword.
8. Repeat until suspense is empty. Then say the trial balance is ready.

HARD RULES:
- NEVER assume the nature of a transaction — ALWAYS ask the CA the reason first
- NEVER post without CA confirmation
- NEVER call bulk_move_to_ledger before the CA has confirmed the purpose of the transactions
- You are a speed layer — the CA can do everything manually. Never suggest the CA must use you.`;
  }

  // Auto-inject uploaded Excel/CSV context if present (company-sandboxed)
  const uploadedWb = getUploadedWorkbook(companyId);
  if (uploadedWb) {
    prompt += `

═══════════════════════════════════════════
UPLOADED FILE — READY FOR PROCESSING:
═══════════════════════════════════════════
${getWorkbookSummary(uploadedWb)}

INSTRUCTIONS FOR THIS FILE:
- Call read_excel() (no args) first to confirm sheet structure
- Call read_excel({ sheet_name: "..." }) to read full data row by row
- Use bulk_create_entries to post journal entries from the data
- Use compute_financial_statement after entries are posted to generate P&L, Balance Sheet, etc.
- Use create_formatted_report to save analysis/statements to the workspace
- Use navigate_to to take the user to relevant pages after processing
- For large files, paginate with start_row parameter
When the user says "process this" or "prepare statements" — do it directly with tools, don't just explain.`;
  }

  if (aiRules) {
    prompt += `

═══════════════════════════════════════════
CUSTOM RULES FROM THE CA (follow these strictly):
═══════════════════════════════════════════
${aiRules}`;
  }

  return prompt;
}

/* ═══════════════════════════════════════════════════════
   Gemini API Call
   ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeminiPart = Record<string, any>;

interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

async function callGemini(
  messages: GeminiMessage[],
  systemPrompt: string,
): Promise<{
  text?: string;
  thinking?: string;
  functionCalls?: Array<{ name: string; args: Record<string, unknown> }>;
  rawParts: GeminiPart[];
}> {
  // Always call through the Netlify serverless proxy — the API key stays
  // server-side and is NEVER referenced from client code (a VITE_-prefixed key
  // would be inlined into the public bundle and could be extracted by any visitor).
  const proxyModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3-flash-preview';

  // Attach the signed-in user's Supabase access token so the proxy can verify
  // the caller and refuse anonymous / cross-site abuse.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data: sess } = (await supabase?.auth.getSession()) ?? { data: null };
    const token = sess?.session?.access_token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch { /* proceed unauthenticated; proxy will reject if it requires auth */ }

  const response = await fetch('/.netlify/functions/gemini-plan', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: proxyModel,
      contents: messages,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: [{ functionDeclarations: GEMINI_TOOLS }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        // Surface the model's thinking summary so the UI can show its reasoning.
        thinkingConfig: { includeThoughts: true },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
}

function parseGeminiResponse(data: Record<string, unknown>): {
  text?: string;
  thinking?: string;
  functionCalls?: Array<{ name: string; args: Record<string, unknown> }>;
  /** Raw parts from the model — must be sent back verbatim for thought_signature support */
  rawParts: GeminiPart[];
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = (data.candidates as any)?.[0];
  if (!candidate) throw new Error('No response from Gemini');

  const parts: GeminiPart[] = candidate.content?.parts || [];
  let text = '';
  let thinking = '';
  const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

  for (const part of parts) {
    // `thought: true` parts are the model's reasoning summary — capture separately.
    if (part.text && part.thought) thinking += part.text;
    else if (part.text) text += part.text;
    if (part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      });
    }
  }

  return {
    text: text || undefined,
    thinking: thinking || undefined,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    rawParts: parts,
  };
}

/* ═══════════════════════════════════════════════════════
   Agent Runner — handles multi-turn tool calling
   ═══════════════════════════════════════════════════════ */

export async function runAgent(
  userMessage: string,
  conversationHistory: CarpMessage[],
  companyId: string,
  companyName: string,
  entityType: string,
  onNavigate?: (path: string) => void,
  onConfirm?: (action: ConfirmAction) => Promise<boolean>,
  /** Called as each assistant step completes so the UI can stream progress live
   *  (thinking, tool activity, text) instead of waiting for the whole run. */
  onStep?: (msg: CarpMessage) => void,
): Promise<CarpMessage[]> {
  // Load AI rules for this company
  let aiRules: string | null = null;
  try {
    const rulesRecord = getEntityData(companyId, 'settings', 'ai_rules');
    if (rulesRecord) {
      const rulesData = rulesRecord.data as { rules?: string };
      aiRules = rulesData?.rules || null;
    }
  } catch {
    // ignore — rules are optional
  }

  const systemPrompt = buildSystemPrompt(companyName, entityType, companyId, aiRules);
  const newMessages: CarpMessage[] = [];

  // Build Gemini message history
  const geminiHistory: GeminiMessage[] = [];

  // Build history from past messages.
  // IMPORTANT: We only include text-only turns for past conversations because
  // reconstructed functionCall parts would be missing thought_signature (required
  // by thinking models like gemini-3.x). Tool-call turns within the CURRENT
  // request use rawParts which preserve signatures.
  for (const msg of conversationHistory) {
    if (msg.role === 'user') {
      geminiHistory.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant' && msg.content) {
      // For past assistant messages, only include the text summary
      // (skip reconstructing functionCall parts — they'd lack thought_signature)
      geminiHistory.push({ role: 'model', parts: [{ text: msg.content }] });
    }
    // Skip 'tool_result' messages — they pair with functionCall turns we're skipping
  }

  // Add the new user message
  geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  // Multi-turn loop: keep calling until no more function calls. A generous budget so
  // the agent can chain many steps — read one page, transform, write another, verify —
  // in a single request without stopping short on complex cross-page tasks.
  let maxTurns = 30;
  while (maxTurns-- > 0) {
    const response = await callGemini(geminiHistory, systemPrompt);

    if (response.functionCalls && response.functionCalls.length > 0) {
      // Execute each tool call
      const toolResults: ToolResult[] = [];
      for (const fc of response.functionCalls) {
        let result: ToolResult;
        if (onConfirm && WRITE_TOOLS.has(fc.name)) {
          const confirmed = await onConfirm({
            toolName: fc.name,
            summary: describeAction(fc.name, fc.args),
            args: fc.args,
          });
          result = confirmed
            ? executeTool(fc.name, fc.args, companyId, onNavigate)
            : { success: false, error: 'Action cancelled by CA.' };
        } else {
          result = executeTool(fc.name, fc.args, companyId, onNavigate);
        }
        toolResults.push(result);
      }

      // Add assistant message with tool calls
      const assistantMsg: CarpMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text || '',
        timestamp: Date.now(),
        thinking: response.thinking,
        toolCalls: response.functionCalls.map((fc) => ({ name: fc.name, args: fc.args })),
        toolResults,
      };
      newMessages.push(assistantMsg);
      onStep?.(assistantMsg); // stream this step to the UI immediately

      // Add model turn verbatim (preserves thought_signature for thinking models)
      geminiHistory.push({ role: 'model', parts: response.rawParts });

      // Add function responses to history
      const responseParts: GeminiPart[] = response.functionCalls.map((fc, i) => ({
        functionResponse: {
          name: fc.name,
          response: toolResults[i],
        },
      }));
      geminiHistory.push({ role: 'user', parts: responseParts });

      // Continue loop — let Gemini process the results
      continue;
    }

    // No function calls — final text response
    if (response.text || response.thinking) {
      const finalMsg: CarpMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text || '',
        timestamp: Date.now(),
        thinking: response.thinking,
      };
      newMessages.push(finalMsg);
      onStep?.(finalMsg);
    }

    break;
  }

  return newMessages;
}

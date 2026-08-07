// STUB — replaced by the schema-derived validator for itr3 A.Y. 2026-27.
import type { MandatoryChecker } from './types';

export const checkMandatory: MandatoryChecker = () => ({
  form: 'itr3',
  ay: '2026-27',
  schemaVersion: 'stub',
  missing: [],
  errors: [{ path: 'ITR', msg: 'Validator for itr3 A.Y. 2026-27 is not built yet.' }],
  warnings: [],
  ok: false,
});

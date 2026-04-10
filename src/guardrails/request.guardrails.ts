const SAFE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,64}$/;
const MAX_QUERY_CHARS = 8000;
const MAX_FILE_IDS = 20;

type GuardrailFailureCode =
  | "INVALID_TENANT_ID"
  | "INVALID_FILE_ID"
  | "TOO_MANY_FILE_IDS"
  | "QUERY_TOO_LARGE"
  | "PROMPT_INJECTION_RISK";

export type GuardrailResult =
  | { ok: true }
  | { ok: false; code: GuardrailFailureCode; message: string };

export type GuardrailInput = {
  tenantId: string;
  query: string;
  fileIds?: string[];
};

function hasPromptInjectionRisk(query: string): boolean {
  const injectionSignal =
    /(ignore\s+(all|any|previous)\s+instructions|override\s+safety|jailbreak|act\s+as\s+system)/i;
  const exfilSignal =
    /(show|reveal|print|dump).*(system\s+prompt|developer\s+prompt|hidden\s+instructions|api\s*keys?|secrets?)/i;

  if (exfilSignal.test(query)) return true;
  return injectionSignal.test(query) && /(prompt|secret|token|key|memory|system)/i.test(query);
}

export function runRequestGuardrails(input: GuardrailInput): GuardrailResult {
  if (!SAFE_ID_PATTERN.test(input.tenantId)) {
    return {
      ok: false,
      code: "INVALID_TENANT_ID",
      message: "tenantId contains unsupported characters.",
    };
  }

  if (input.fileIds && input.fileIds.length > MAX_FILE_IDS) {
    return {
      ok: false,
      code: "TOO_MANY_FILE_IDS",
      message: `fileIds exceeds max allowed count (${MAX_FILE_IDS}).`,
    };
  }

  for (const fileId of input.fileIds ?? []) {
    if (!SAFE_ID_PATTERN.test(fileId)) {
      return {
        ok: false,
        code: "INVALID_FILE_ID",
        message: `fileId "${fileId}" contains unsupported characters.`,
      };
    }
  }

  if (input.query.length > MAX_QUERY_CHARS) {
    return {
      ok: false,
      code: "QUERY_TOO_LARGE",
      message: `query exceeds max allowed length (${MAX_QUERY_CHARS} chars).`,
    };
  }

  if (hasPromptInjectionRisk(input.query)) {
    return {
      ok: false,
      code: "PROMPT_INJECTION_RISK",
      message: "query blocked by guardrails due to injection/exfiltration risk.",
    };
  }

  return { ok: true };
}

import type { FindFormulaRequest, FormulaHit } from "../core/types";

export type WorkerRequest =
  | { type: "search"; requestId: string; payload: FindFormulaRequest }
  | { type: "cancel"; requestId: string };

export type WorkerResponse =
  | { type: "result"; requestId: string; hits: FormulaHit[] }
  | { type: "error"; requestId: string; message: string };

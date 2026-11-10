/**
 * Interface seam for future AI services. Types only: nothing here is
 * implemented or wired to a provider in Phase 1.
 *
 * The rule this file exists to enforce: application and UI code depend on
 * these interfaces, never on a specific vendor SDK. Provider adapters
 * (OpenAI first, then Anthropic and Gemini) and the optional Python/FastAPI
 * service will live behind them. See docs/ARCHITECTURE.md, "AI layer".
 */

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmUsage = { inputTokens: number; outputTokens: number; costUsd?: number; latencyMs: number };

export type LlmRequest<TSchema = unknown> = {
  messages: LlmMessage[];
  /** JSON schema for structured output, when the caller needs a typed result. */
  outputSchema?: TSchema;
  temperature?: number;
  maxOutputTokens?: number;
};

export type LlmResponse<TOutput = string> = {
  output: TOutput;
  model: string;
  provider: string;
  usage: LlmUsage;
};

/** One adapter per vendor implements this. */
export interface LlmProvider {
  readonly name: string;
  complete<TOutput = string>(request: LlmRequest): Promise<LlmResponse<TOutput>>;
  embed(texts: string[]): Promise<number[][]>;
}

/** The specialised analysts planned for later phases. */
export type AiSpecialist =
  | "agent_risk_analyst"
  | "insurance_policy_analyst"
  | "insurance_matching_agent"
  | "compliance_research_agent"
  | "incident_response_agent"
  | "customer_support_agent";

/**
 * Contract between the web application and an AI service, whether that service
 * runs in-process or as a separate deployment. Every task is scoped to one
 * organisation, resolved on the server from the caller's membership.
 */
export type AiTaskRequest<TInput = unknown> = {
  organisationId: string;
  requestedBy: string;
  specialist: AiSpecialist;
  input: TInput;
  /** When true the task must pause for human approval before any side effect. */
  requiresApproval: boolean;
};

export type AiTaskStatus = "queued" | "running" | "awaiting_approval" | "succeeded" | "failed";

export type AiTaskResult<TOutput = unknown> = {
  taskId: string;
  status: AiTaskStatus;
  output?: TOutput;
  traceId?: string;
  usage?: LlmUsage;
  error?: string;
};

export interface AiTaskService {
  submit<TInput, TOutput>(request: AiTaskRequest<TInput>): Promise<AiTaskResult<TOutput>>;
  get<TOutput>(taskId: string, organisationId: string): Promise<AiTaskResult<TOutput> | null>;
}

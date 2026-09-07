export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export const DEFAULT_GENERATE_OPTIONS: Required<GenerateOptions> = {
  temperature: 0.4,
  maxTokens: 400,
  timeoutMs: 15000,
};

export interface ModelProvider {
  generate(
    systemPrompt: string,
    userPrompt: string,
    options?: GenerateOptions,
  ): Promise<string>;
}

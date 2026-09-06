export interface ModelProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

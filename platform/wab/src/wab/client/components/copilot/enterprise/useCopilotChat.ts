export interface CopilotTextPart {
  type: 'text';
  text: string;
  state?: string;
}

export interface CopilotToolPart {
  type: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

export type CopilotUIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<CopilotTextPart | CopilotToolPart>;
};

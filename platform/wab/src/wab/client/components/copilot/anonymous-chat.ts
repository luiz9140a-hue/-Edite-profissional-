import { ProjectId } from "@/wab/shared/ApiSchema";
import { ANONYMOUS_CHAT_USER_ID, getCopilotChat } from "@/wab/client/components/copilot/enterprise/chat-storage";
import type { CopilotUIMessage } from "@/wab/client/components/copilot/enterprise/useCopilotChat";

/**
 * Public stub for {@link isAnonymousQuotaReached}.
 */
export async function isAnonymousQuotaReached(_projectId: ProjectId) {
  const chat = await getCopilotChat(ANONYMOUS_CHAT_USER_ID, _projectId);
  return Boolean(chat && isGenerationComplete(chat.messages));
}

export function isGenerationComplete(messages: CopilotUIMessage[]) {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant") return false;
  return last.parts.some(part => part.type === "text" && part.state !== "streaming");
}

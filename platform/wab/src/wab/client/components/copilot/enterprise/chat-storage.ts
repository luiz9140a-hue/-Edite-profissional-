import type { ProjectId } from '@/wab/shared/ApiSchema';
import type { CopilotUIMessage } from './useCopilotChat';

export const ANONYMOUS_CHAT_USER_ID = 'anonymous';

type StoredChat = {
  chatId: string;
  userId: string;
  projectId: ProjectId;
  updatedAt: number;
  messages: CopilotUIMessage[];
};

const chats = new Map<string, StoredChat>();

export async function saveCopilotChat(chat: StoredChat) {
  chats.set(`${chat.userId}:${chat.projectId}`, { ...chat, messages: [...chat.messages] });
}

export async function getCopilotChat(userId: string, projectId: ProjectId) {
  return chats.get(`${userId}:${projectId}`) ?? null;
}

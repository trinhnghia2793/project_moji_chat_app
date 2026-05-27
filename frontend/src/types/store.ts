import type { Conversation, Message } from "./chat";
import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accesstoken: string) => void;
  clearState: () => void;

  signUp: (
    username: string,
    password: string, 
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;

  signIn: (
    username: string,
    password: string,
  ) => Promise<void>;

  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;

}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<string, {
    items: Message[],
    hasMore: boolean, // infinite-scroll
    nextCursor?: string | null, // phân trang
  }>;
  activeConversationId: string | null; // id của cuộc trò chuyện đang mở
  converLoading: boolean;
  messageLoading: boolean;

  reset: () => void;
  setActiveConversation: (id: string | null) => void; // để những component khác cập nhật giá trị của active conversation
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;
}


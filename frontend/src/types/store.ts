import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accesstoken: string) => void;
  setUser: (user: User) => void;
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

export interface ChatState { // used in useChatStore.ts
  conversations: Conversation[];
  messages: Record<string, {
    items: Message[],
    hasMore: boolean, // infinite-scroll
    nextCursor?: string | null, // phân trang
  }>;
  activeConversationId: string | null; // id của cuộc trò chuyện đang mở
  converLoading: boolean;
  messageLoading: boolean;
  loading: boolean;

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
  addMessage: (message: Message) => Promise<void>; // add message
  updateConversation: (conversation: unknown) => void; // update conversation properties
  markAsSeen: () => Promise<void>;
  addConver: (conver: Conversation) => void; // thêm conversation vào danh sách conversations trong store
  createConversation: (type: "group" | "direct", name: string, memberIds: string[]) => Promise<void>; // tạo cuộc trò chuyện: gọi API từ chatService ở backend --> cập nhật store
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean; // khi nào api chạy xong
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}
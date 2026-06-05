import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      converLoading: false, // conversation loading
      messageLoading: false, // message box loading
      loading: false, // for create new conversation

      //
      setActiveConversation: (id) => set({ activeConversationId: id }),
      //
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          converLoading: false,
          messageLoading: false,
        });
      },
      //
      fetchConversations: async () => {
        // được gọi sau khi sign in thành công
        try {
          set({ converLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, converLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ converLoading: false });
        }
      },
      //
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const converId = conversationId ?? activeConversationId;
        if (!converId) return;

        const current = messages?.[converId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            converId,
            nextCursor,
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id, // phân biệt tin nhắn của user để render ui khác với người khác
          }));

          set((state) => {
            const prev = state.messages[converId]?.items ?? [];
            const merged =
              prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [converId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      //
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
          );
          // reset danh sách đã đọc
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi khi gửi directMessage", error);
        }
      },
      //
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl);
          // reset danh sách đã đọc
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi khi gửi groupMessage", error);
        }
      },
      //
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const converId = message.conversationId;

          let prevItems = get().messages[converId]?.items ?? [];
          // chưa mở conversation trước đó --> không có prevItems --> fetch messages đã
          if(prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[converId]?.items ?? [];
          }

          set((state) => {
            // đã có tin nhắn ? return : set messages mới
            if(prevItems.some((m) => m._id === message._id)) {
              return state;
            }
            return {
              messages: {
                ...state.messages,
                [converId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[converId].hasMore,
                  nextCursor: state.messages[converId].nextCursor ?? undefined,
                }
              }
            }
          });
        } catch (error) {
          console.error("Lỗi khi add message (useChatStore)", error);
        }
      },
      //
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) => 
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      //
      markAsSeen: async() => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const conver = conversations.find((c) => c._id === activeConversationId);
          if (!conver) {
            return;
          }

          if ((conver.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          //==================
          await chatService.markAsSeen(activeConversationId);

          set((state) => ({ // cập nhật lại state
            conversations: state.conversations.map((c) => (
              c._id === activeConversationId && c.lastMessage 
                ? {
                  ...c,
                  unreadCounts: {
                    ...c.unreadCounts,
                    [user._id]: 0
                  }
                }
                : c
            )),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      //
      addConver: (conver) => {
        set((state) => {
          const exists = state.conversations.some((c) => c._id.toString() === conver._id.toString());
          return {
            conversations: exists
              ? state.conversations
              : [conver, ...state.conversations],
            activeConversationId: conver._id,
          };
        });
      },
      //
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(type, name, memberIds);
          get().addConver(conversation);

          // socket emit
          useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);

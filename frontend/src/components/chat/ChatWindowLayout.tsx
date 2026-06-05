import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect } from "react";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messageLoading: loading,
    // messages,
    markAsSeen,
  } = useChatStore();

  const selectedConver =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    if(!selectedConver) {
      return;
    }

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.log("Lỗi khi markSeen", error);
      }
    }
    
    markSeen();
  }, [markAsSeen, selectedConver]);

  if (!selectedConver) {
    return <ChatWelcomeScreen />;
  }

  if (loading) {
    return <ChatWindowSkeleton />;
  }

  return (
    <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
      {/* Header */}
      <ChatWindowHeader chat={selectedConver} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-primary-foreground">
        <ChatWindowBody />
      </div>

      {/* Footer */}
      <MessageInput selectedConver={selectedConver} />
    </SidebarInset>
  );
};

export default ChatWindowLayout;

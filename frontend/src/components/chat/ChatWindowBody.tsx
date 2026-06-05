import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    fetchMessages,
  } = useChatStore();
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered");

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConver = conversations.find(
    (c) => c._id === activeConversationId,
  );
  const key = `chat-scroll-${activeConversationId}`;

  // ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // set last message status
  useEffect(() => {
    const lastMessage = selectedConver?.lastMessage;
    if (!lastMessage) {
      return;
    }

    const seenBy = selectedConver?.seenBy ?? [];

    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConver]);

  // kéo xuống dưới khi load conversation
  useLayoutEffect(() => { // chạy ngay sau khi React cập nhật DOM & trước khi trình duyệt vẽ lại layout
    if(!messagesEndRef.current) {
      return;
    }
    
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth", // optional
      block: "end",
    });
    //
  }, [activeConversationId]);

  // fetch thêm tin nhắn khi người dùng cuộn lên
  const fetchMoreMessages = async () => {
    if (!activeConversationId) {
      return;
    }
    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Lỗi xảy ra khi fetch thêm tin nhắn", error);
    }
  }

  // lưu vị trí cuộn hiện tại
  const handleScrollSave = () => {
    const container = containerRef.current;
    if(!container || !activeConversationId) {
      return;
    }

    sessionStorage.setItem(
      key,
      JSON.stringify({
        scrollTop: container.scrollTop, // vị trí cuộn hiện tại
        scrollHeight: container.scrollHeight, // tổng chiều cao có thể cuộn được
      }),
    );
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    if(!container) return;

    const item = sessionStorage.getItem(key);
    if(item) {
      const { scrollTop } = JSON.parse(item);
      requestAnimationFrame(() => {
        container.scrollTop = scrollTop;
      })
    }
  }, [messages.length]);

  //
  if (!selectedConver) {
    return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground select-none">
        Chưa có tin nhắn nào trong cuộc trò chuyện này
      </div>
    );
  }

  // return 
  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div 
        id="scrollableDiv"
        ref={containerRef}
        onScroll={handleScrollSave}
        className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
      >
        <div ref={messagesEndRef}></div>
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<p>Đang tải...</p>}
          inverse={true}
          style={{ 
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "visible"
          }}
        >
          {reversedMessages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              messages={reversedMessages}
              selectedConver={selectedConver}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default ChatWindowBody;

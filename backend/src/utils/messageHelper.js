// cập nhật lại thông tin conversation sau khi thêm tin nhắn mới (cho cả direct và group conversation)
export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
  // set thông tin chung của conversation
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    }
  });

  // set số tin nhắn chưa đọc của người gửi và (các) người nhận
  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;

    // nếu là người gửi --> set unreadCounts về 0
    // nếu là (các) người nhận --> unreadCounts thêm 1
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1); 
  });
  
}

// phát đi sự kiện new message vào một room
export const emitNewMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  });
}
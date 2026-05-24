import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

//=================================================================================
export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let conversation; // lưu thông tin cuộc trò chuyện

    // nếu gửi tin nhắn rỗng
    if(!content) {
      return res.status(400).json({
        message: "Thiếu nội dung tin nhắn",
      });
    }

    // lấy conversationId --> tìm conversation (chưa có --> tạo conversation mới)
    if(conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    if(!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() }
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map()
      });
    }

    // tạo tin nhắn mới trong conversation
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });
    // update thông tin conversation
    updateConversationAfterCreateMessage(conversation, message, senderId);

    // save & return
    await conversation.save();
    return res.status(201).json({
      message
    });

  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({
      message: "Lỗi hệ thống"
    }); 
  }
}

//=================================================================================
// nhắn tin vào nhóm
export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if(!content) {
      return res.status(400).json({
        message: "Thiếu nội dung"
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    return res.status(201).json({
      message
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({
      message: "Lỗi hệ thống"
    }); 
  }

}
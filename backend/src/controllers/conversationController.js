import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

//==============================================================================================
// tạo cuộc trò chuyện nhắn trực tiếp / nhóm mới
export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    // 
    if (!type ||
      (type === "group" && !name) ||
      !memberIds || !Array.isArray(memberIds) || memberIds.length === 0
    ) {
      return res.status(400).json({
        message: "Tên nhóm và danh sách thành viên là bắt buộc"
      });
    }

    let conversation;

    // chat trực tiếp
    if (type === "direct") {
      const participantId = memberIds[0];

      // kiểm tra giữa 2 người đã có cuộc trò chuyện nào chưa
      conversation = await Conversation.findOne(
        { type: "direct", "participants.userId": { $all: [userId, participantId] } },
      );
      // nếu không tìm thấy --> chưa có --> tạo cuộc trò chuyện mới
      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date()
        });
        await conversation.save();
      }
    }

    // chat nhóm
    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [
          { userId },
          ...memberIds.map((id) => ({ userId: id })),
        ],
        group: {
          name,
          createdBy: userId
        },
        lastMessageAt: new Date()
      });
      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({
        message: "Conversation type không hợp lệ"
      });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    return res.status(201).json({
      conversation
    });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

//==============================================================================================
// lấy danh sách cuộc trò chuyện
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation
      .find({ 'participants.userId': userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({ path: 'participants.userId', select: 'displayName avatarUrl' })
      .populate({ path: 'lastMessage.senderId', select: 'displayName avatarUrl' })
      .populate({ path: 'seenBy', select: 'displayName avatarUrl' });

    const formatted = conversations.map((conver) => {
      const participants = (conver.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));
      return {
        ...conver.toObject(),
        unreadCounts: conver.unreadCounts || {},
        participants,
      };
    });

    return res.status(200).json({
      conversations: formatted
    });
  } catch (error) {
    console.error("Lỗi khi lấy conversations", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

//==============================================================================================
// lấy danh sách tin nhắn từ một đoạn hội thoại
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    let messages = await Message
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1); // lấy thừa 1 tin để kiểm tra còn tin nhắn tiếp hay không

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }
    messages = messages.reverse();

    // return
    return res.status(200).json({
      messages,
      nextCursor
    })
  } catch (error) {
    console.error("Lỗi khi lấy messages", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

//==============================================================================================
// lấy danh sách id của các cuộc hội thoại thuộc về 1 user
export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 }, // chỉ lấy trường id
    );
    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations trong socketIO ", error);
    return [];
  }
}
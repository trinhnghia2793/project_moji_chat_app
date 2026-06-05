import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js"; 

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

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    })); // đoạn này giống ở trong hàm getConversations (lặp)
    const formatted = {...conversation.toObject(), participants};

    if (type === "group") {
      // emit cho mỗi thành viên có trong nhóm
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    return res.status(201).json({
      conversation: formatted,
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

//==============================================================================================
// đánh dấu tin nhắn đã đọc
export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean(); // lean: trả về javascript object thay vì mongoose document
    if (!conversation) {
      return res.status(404).json({
        message: "Conversation không tồn tại"
      });
    }

    const last = conversation.lastMessage;
    if (!last) {
      return res.status.json(200).json({
        message: "Không có tin nhắn để markAsSeen"
      });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({
        message: "Sender không cần markAsSeen"
      });
    }

    //===============
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId }, // thêm không trùng userId vào mảng seenBy
        $set: { [`unreadCounts.${userId}`]: 0 }, // set số tin chưa đọc của user hiện tại về 0
      },
      {
        new: true // trả về document sau khi update (mặc định không có cái này --> trả về document cũ)
      }
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        }
      }
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0, // lấy số lượng tin chưa đọc của user hiện tại
    });
  } catch (error) {
    console.error("Lỗi khi markAsSeen", error);
    return res.status(500).json({
      message: "Lỗi hệ thống"
    });
  }
}
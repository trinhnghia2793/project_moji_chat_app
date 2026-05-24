import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      requried: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// this is compound index (index kết hợp từ nhiều trường)
// 1: asc; -1: desc
messageSchema.index(
  { conversationId: 1, createdAt: -1 },
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
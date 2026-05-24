import mongoose from "mongoose";

// participant subSchema
const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }, 
  {
    _id: false, // không tạo id riêng cho schema  này
  }
);

// group subSchema
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  }
);

// last message subSchema
const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String }, // id tin nhắn gốc, không phải id tự tạo
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    }
  },
  {
    _id: false,
  }
)

// conversation schema (main)
const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    participants: {
      // schema phụ
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    }
  },
  {
    timestamps: true,
  }
);

conversationSchema.index(
  { "participant.userId": 1, lastMessageAt: -1 },
); // will use for searching for user's messages

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
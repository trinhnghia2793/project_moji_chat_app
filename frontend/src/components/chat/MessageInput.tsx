import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConver }: { selectedConver: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");

  if (!user) return;

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currentValue = value;
    setValue("");

    try {
      if (selectedConver.type === "direct") {
        const participants = selectedConver.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currentValue);
      } else {
        await sendGroupMessage(selectedConver._id, currentValue);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Hãy thử lại sau");
    }
  };

  // nhấn enter để gửi
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 min-h-14 bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth"
      >
        <ImagePlus className="size-4" />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyDown={handleKeyPress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Soạn tin nhắn"
          className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <div
            // asChild
            // variant="ghost"
            // size="icon"
            className="size-8 hover:bg-primary/10 transition-smooth"
          >
            <div className="flex items-center justify-center h-full">
              {/* emoji picker */}
              <EmojiPicker
                onChange={(emoji: string) => setValue(`${value}${emoji}`)}
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim()}
      >
        <Send className="size-4 text-white" />
      </Button>
    </div>
  );
};

export default MessageInput;

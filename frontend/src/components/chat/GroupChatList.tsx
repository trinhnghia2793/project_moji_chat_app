import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
  const { conversations } = useChatStore();

  if(!conversations) return;
  const groupChats = conversations.filter((conver) => conver.type === 'group');

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {
        groupChats.map((conver) => (
          <GroupChatCard
            key={conver._id}
            conver={conver}
          />
        ))
      }
    </div>
  );
}

export default GroupChatList
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "../addFriendModal/SearchForm";
import SendFriendRequestForm from "../addFriendModal/SendFriendRequestForm";

export interface IFormValues {
  username: string;
  message: string;
}

const AddFriendModal = () => {
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [searchUser, setSearchUser] = useState<User>(); // lưu thông tin user tìm được 
  const [searchedUsername, setSearchedUsername] = useState(""); // lưu username đã được search (để báo trạng thái tìm thấy)
  const { loading, searchByUsername, addFriend } = useFriendStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: { username: "", message: "" }
  });

  const usernameValue = watch("username");

  // xử lý gửi request tìm kiếm user
  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim();
    if (!username) return;

    // before search: set isFound and searchedUsername
    setIsFound(null);
    setSearchedUsername(username);

    try {
      const foundUser = await searchByUsername(username);
      if (foundUser) {
        setIsFound(true);
        setSearchUser(foundUser);
      } else {
        setIsFound(false);
      }
    } catch (error) {
      console.error(error);
      setIsFound(false);
    }
  });

  // xử lý gửi request yêu cầu kết bạn
  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return;

    try {
      const message = await addFriend(searchUser._id, data.message.trim());
      toast.success(message);

      handleCancel();
    } catch (error) {
      console.error("Lỗi xảy ra khi gửi request từ form", error);
    }
  });

  //
  const handleCancel = () => {
    reset();
    setSearchedUsername("");
    setIsFound(null);
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
            <UserPlus className="size-4" />
            <span className="sr-only">Kết bạn</span>
          </div>
        }
        nativeButton={false}
      />
      <DialogContent className="sm:max-w-106.25 border-none">
        <DialogHeader>
          <DialogTitle>Kết bạn</DialogTitle>
        </DialogHeader>

        {!isFound && 
          // form search by username
          <>
            <SearchForm 
              register={register}
              errors={errors}
              usernameValue={usernameValue}
              loading={loading}
              isFound={isFound}
              searchUsername={searchedUsername}
              onSubmit={handleSearch}
              onCancel={handleCancel}
            />
          </>
        }

        {isFound && 
          // form send friend request
          <>
            <SendFriendRequestForm 
              register={register}
              loading={loading}
              searchedUsername={searchedUsername}
              onSubmit={handleSend}
              onBack={() => setIsFound(null)}
            />
          </>
        }
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;

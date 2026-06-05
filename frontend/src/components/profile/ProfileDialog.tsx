import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PersonalInfoForm from "./PersonalInfoForm";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySettings";

interface ProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>
}

const ProfileDialog = ({
  open,
  setOpen
}: ProfileDialogProps) => {
  const { user } = useAuthStore();

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen} // tự động truyền vào giá trị false khi bấm ra ngoài / dấu x
    >
      <DialogContent className="max-w-125! w-125 max-h-[95vh] overflow-y-auto p-0 bg-transparent border-0 shadow-2xl">
        <div className="bg-gradient-glass">
          <div className="max-w-4xl mx-auto p-4">
            {/* heading */}
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Profile & Settings
              </DialogTitle>
            </DialogHeader>

            {/* card */}
            <ProfileCard user={user} />

            {/* tabs */}
            <Tabs
              defaultValue="personal"
              className="my-4"
            >
              <TabsList className="grid w-full grid-cols-3 glass-light">
                {/* tab triggers */}
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:glass-strong"
                >
                  Tài Khoản
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="data-[state=active]:glass-strong"
                >
                  Cấu Hình
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:glass-strong"
                >
                  Bảo Mật
                </TabsTrigger>
              </TabsList>
              {/* tab contents */}
              <TabsContent value="personal">
                <PersonalInfoForm userInfo={user} />
              </TabsContent>
              <TabsContent value="preferences">
                <PreferencesForm />
              </TabsContent>
              <TabsContent value="privacy">
                <PrivacySettings />
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileDialog
import { create } from 'zustand';
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

// zustand create
export const useAuthStore = create<AuthState>() (
  // persist
  persist(
    (set, get) => ({
      // Các state lưu giá trị
      accessToken: null,
      user: null,
      loading: false, // trạng thái khi gọi api
      
      // setAccessToken
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      // setUser
      setUser: (user) => {
        set({ user: user });
      },
      // clearState when sign out
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear();
      },
      
      // signUp called from form
      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });
          
          // call api
          await authService.signUp(username, password, email, firstName, lastName);
          
          toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập");
        } catch (error) {
          console.error(error);
          toast.error("Đăng ký không thành công");
        } finally {
          set({ loading: false });
        }
      },
      
      // signIn called from form
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });
          
          const { accessToken } = await authService.signIn(username, password);
          get().setAccessToken(accessToken);
          
          await get().fetchMe();
          useChatStore.getState().fetchConversations();
          
          toast.success("Chào mừng bạn quay trở lại!");
        } catch (error) {
          console.error(error);
          toast.error("Đăng nhập không thành công");
        } finally {
          set({ loading: false });
        }
      },
      
      // signOut from ui
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();   
          toast.success("Logout thành công");
        } catch (error) {
          console.error(error);
          toast.error("Có lỗi xảy ra khi logout");
        }
      },
      
      // get user data
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();
          set({ user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng");
        } finally {
          set({ loading: false });
        }
      },
      
      // refresh (get new access token from refresh token)
      refresh: async () => {
        try {
          set({ loading: true });
          
          const { user, fetchMe } = get();
          
          const accessToken = await authService.refresh();
          get().setAccessToken(accessToken);
          
          if(!user) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }), 
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    }
  )
);
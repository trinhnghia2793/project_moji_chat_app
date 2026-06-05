import api from "@/lib/axios";

export const friendService = {
  // tìm kiếm user theo username
  async searchByUsername(username: string) {
    const res = await api.get(`/users/search?username=${username}`);
    return res.data.user;
  },

  // gửi lời mời kết bạn
  async sendFriendRequest(to: string, message?: string) {
    const res = await api.post("/friends/requests", {
      to,
      message
    });
    return res.data.message
  },
  
  // lấy danh sách lời mời kết bạn (từ cả 2 phía)
  async getAllFriendRequest() {
    try {
      const res = await api.get("/friends/requests");
      
      const { sent, received } = res.data;
      return { sent, received };
    } catch (error) {
      console.error("Lỗi khi gửi getAllFriendRequest", error);
    }
  },

  // chấp nhận lời mời kết bạn
  async acceptRequest(requestId: string) {
    try {
      const res = await api.post(`/friends/requests/${requestId}/accept`);
      return res.data.requestAcceptedBy;
    } catch (error) {
      console.error("Lỗi khi gửi acceptRequest", error);
    }
  },

  // từ chối lời mời kết bạn
  async declineRequest(requestId: string) {
    try {
      await api.post(`/friends/requests/${requestId}/decline`);
    } catch (error) {
      console.error("Lỗi khi gửi declineRequest", error);
    }
  },

  // note: chưa có thu hồi lời mời kết bạn

  // lấy danh sách bạn bè
  async getFriendList() {
    const res = await api.get("/friends");
    return res.data.friends;
  }
}
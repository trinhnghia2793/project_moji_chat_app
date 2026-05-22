import api from "@/lib/axios";

export const authService = {
  // signUp called from /store
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    const res = await api.post(
      "auth/signup",
      { username, password, email, firstName, lastName },
      { withCredentials: true },
    );
    return res.data;
  },

  // signIn called from /store
  signIn: async (
    username: string,
    password: string,
  ) => {
    const res = await api.post(
      "auth/signin",
      { username, password },
      { withCredentials: true },
    );
    return res.data; // là access token được trả về từ server
  },

  // signOut called from ?
  signOut: async () => {
    return await api.post("/auth/signout", {}, { withCredentials: true });
  },

  // fetch current user data
  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  // refresh
  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data.accessToken;
  }

};

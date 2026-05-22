// Mô tả cấu trúc dữ liệu User mà backend sẽ trả về
export interface User {
  _id: string,
  username: string,
  email: string,
  displayName: string,
  avatarUrl?: string,
  bio?: string,
  phone?: string,
  createdAt?: string,
  updatedAt?: string,
}
import mongoose from 'mongoose';
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Liên kết cơ sở dữ liệu thành công!");

  } catch (error) {
    console.log("Lỗi khi kết nối cơ sở dữ liệu: ", error);
    process.exit(1);
  }
}
import multer from 'multer';
import { v2 as cloudinary } from "cloudinary";

export const upload = multer({
  storage: multer.memoryStorage(), // lưu file dưới dạng dữ liệu thô trong bộ nhớ RAM thay vì ổ cứng
  limit: {
    fileSize: 1024 * 1024 * 1, // 1MB
  },
})

// gửi ảnh đã nhận lên cloudinary
export const uploadImageFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "moji_chat_app/avatars",
        resource_type: "image",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result); // result sẽ chứa URL và ID của hình
        }
      }
    );

    uploadStream.end(buffer);
  });
}
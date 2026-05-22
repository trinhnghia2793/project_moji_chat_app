import jwt from 'jsonwebtoken';
import User from "../models/User.js";

// authorization - xác minh user gửi request vào server
export const protectedRoute = (req, res, next) => { // next: callback: chuyển tiếp luồng xử lý sang bước kế tiếp
  try {
    // lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // index[0]: Bearer; index[1]: <token>

    if (!token) {
      return res.status(401).json({
        message: "Không tìm thấy access token",
      });
    }

    // xác nhận token hợp lệ
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        console.error(err);
        return res.status(403).json({
          message: "Access token hết hạn / không đúng",
        });
      }

      // tìm thông tin user
      const user = await User.findById(decodedUser.userId).select('-hashedPassword');
      if(!user) {
        return res.status(404).json({
          message: "Người dùng không tồn tại",
        });
      }
  
      // trả user về trong req
      req.user = user;
      next();
    });

  } catch (error) {
    console.error("Lỗi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });

  }
}
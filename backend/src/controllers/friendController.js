import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

// ===========================================================================
// gửi lời mời kết bạn
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id; // id người đang đăng nhập

    if(from === to) {
      return res.status(400).json({
        message: "Không thể gửi lời mời kết bạn cho chính mình",
      });
    }

    // kiểm tra thông tin người gửi lời mời có tồn tại không
    const userExists = await User.exists({ _id: to });
    if(!userExists) {
      return res.status(400).json({
        message: "Người dùng không tồn tại",
      });
    }

    // kiểm tra mối quan hệ giữa 2 user
    let userA = from.toString();
    let userB = to.toString();
    if(userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }), // kiểm tra đã là bạn bè chưa
      FriendRequest.findOne({ // kiểm tra đã có lời mời kết bạn giữa 2 người này chưa
        $or: [
          { from, to },
          { from: to, to: from },
        ]
      })
    ]); 
    if(alreadyFriends) {
      return res.status(400).json({
        message: "Hai người đã là bạn bè",
      });
    }
    if(existingRequest) {
      return res.status(400).json({
        message: "Đã có lời mời kết bạn đang chờ",
      });
    }

    // tạo mới lời mời kết bạn
    const request = await FriendRequest.create({
      from,
      to,
      message
    });

    return res.status(201).json({
      message: "Gửi lời mời kết bạn thành công",
      request
    });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu kết bạn", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

// ===========================================================================
// chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // kiểm tra lời mời kết bạn có tồn tại không | người nhận lời mời có phải là user không
    const request = await FriendRequest.findById(requestId);
    if(!request) {
      return res.status(404).json({
        message: "Không tìm thấy lời mời kết bạn",
      });
    } 
    if(request.to.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền chấp nhận lời mời kết bạn này",
      });
    }

    // tạo mới mối quan hệ bạn bè | xóa lời mời kết bạn của 2 user này
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });
    await FriendRequest.findByIdAndDelete(requestId);

    // lấy thông tin của người gửi lời mời để trả về client hiển thị trên giao diện
    const from = await User
                        .findById(request.from)
                        .select('_id displayName avatarUrl')
                        .lean(); // lean --> tối ưu hiệu năng của query (trả về javascript object thay vì mongoose document) --> nhanh và nhẹ hơn

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

// ===========================================================================
// từ chối lời mời kết bạn
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    // kiểm tra lời mời kết bạn có tồn tại không | người nhận lời mời có phải là user không
    const request = await FriendRequest.findById(requestId);
    if(!request) {
      return res.status(404).json({
        message: "Không tìm thấy lời mời kết bạn",
      });
    }
    if(request.to.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền từ chối lời mời kết bạn này",
      });
    }

    // xóa lời mời kết bạn của 2 user này
    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời kết bạn", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

// ===========================================================================
// lấy danh sách bạn bè
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend
      .find({
        $or: [
          { userA: userId },
          { userB: userId },
        ]
      })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean();

    // không có mối quan hệ bạn bè --> return 
    if(!friendships.length) {
      return res.status(200).json({
        friends: [],
      });
    }

    // trong danh sách mối quan hệ, userId nằm ở B --> lấy A (ngược lại)
    const friends = friendships.map((f) => 
      f.userA.toString() === userId.toString()
        ? f.userB
        : f.userA
    );

    //return 
    return res.status(200).json({
      friends
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}

// ===========================================================================
// lấy danh sách yêu cầu kết bạn
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id username displayname avatarUrl";

    // lấy danh sách lời mời đã gửi / đã nhận
    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    //
    return res.status(200).json({
      sent,
      received,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
}
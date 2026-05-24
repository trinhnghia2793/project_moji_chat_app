import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// chạy trước khi lưu dữ liệu vào db (act like middleware)
// friendSchema.pre('save', function (next) {
//   const a = this.userA.toString();
//   const b = this.userB.toString();
//   if (a > b) {
//     this.userA = new mongoose.Types.ObjectId(b);
//     this.userB = new mongoose.Types.ObjectId(a);//31:29
//   }
//   next();
// }); // this is old version, next() is no longer support in mongoose 9
friendSchema.pre('save', function () {
  const a = this.userA.toString();
  const b = this.userB.toString();
  if (a > b) {
    this.userA = new mongoose.Types.ObjectId(b);
    this.userB = new mongoose.Types.ObjectId(a);
  }
}); 

// index
friendSchema.index(
  { userA: 1, userB: 1 },
  { unique: true },
);

//
const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
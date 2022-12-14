import mongoose from "mongoose";
import { chatSchema } from "./chatsModal";
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const followerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  message: [chatSchema],
});
const followingSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  message: [chatSchema],
});
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 12,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
      },
    ],
    followers: [followerSchema],
    following: [followingSchema],
    onlineUser: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const userModal = mongoose.model("user", userSchema);
export default userModal;

import User from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Message } from "../utils/message.js";

const uploadDir = "src/uploads/profile";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  },
}).single("profilePicture");

export const viewProfile = async (req, res) => {
  try {
    // const user = await User.findById(req.user.id).select('-password');
    const user = await User.find();
    if (!user) {
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

// for single user

export const viewProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const createProfile = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);
    console.log("Received File:", req.file);

    let {
      userName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      designation,
      password,
    } = req.body;

    let profileData = {
      userName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      designation,
      password,
    };
    if (req.file) {
      profileData.profilePicture = `uploads/profile/${req.file.filename}`;
    } else {
      profileData.profilePicture = "";
    }

    const user = await User.create(profileData);
    res
      .status(201)
      .json({ message: Message.NEW_PROFILE_CREATED_SUCCESSFULLY, user });
  } catch (error) {
    console.log("errorr---------->>>>>>>", error);
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);
    const userId = req.user.id;
    const {
      userName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      designation,
      password,
    } = req.body;

    let updateData = {
      userName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      designation,
      password,
    };

    if (req.file) {
      updateData.profilePicture = `uploads/profile/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }

    res
      .status(200)
      .json({
        message: Message.PROFILE_UPDATED_SUCCESSFULLY,
        user: updatedUser,
      });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export { upload };

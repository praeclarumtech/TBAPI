import User from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import { Message } from '../utils/message.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in "uploads/" directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  }
}).single('profilePicture');



export const viewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user){
        logger.warn(`${Message.USER_NOT_FOUND}: ${req.user.id}`);
        return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    logger.info(`${Message.PROFILE_FRTCHDES_SUCCESSFULLY} ${req.user.id}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR} ${req.user.id}: ${error.message}`);
    res.status(500).json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const createProfile = async (req, res) => {
    try {
      const { userName, email, phoneNumber, dateOfBirth, gender, designation } = req.body;
  
      let profileData = { userName, email, phoneNumber, dateOfBirth, gender, designation };
  
      if (req.file) {
        profileData.profilePicture = `/uploads/${req.file.filename}`;
      }
  
      const user = await User.create(profileData);
      logger.info(`${Message.NEW_PROFILE_CREATED_SUCCESSFULLY}`);
  
      res.status(201).json({ message: Message.NEW_PROFILE_CREATED_SUCCESSFULLY, user: user });
    } catch (error) {
      logger.error(`Error creating profile: ${error.message}`);
      res.status(500).json({ message: Message.SERVER_ERROR, error: error.message });
    }
  };

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userName, email, phoneNumber, dateOfBirth, gender, designation } = req.body;

    let updateData = { userName, email, phoneNumber, dateOfBirth, gender, designation };

    
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    if (!updatedUser) {
        logger.warn(`${Message.USER_NOT_FOUND}: ${userId}`);
        return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    logger.info(`User ${userId} ${Message.PROFILE_UPDATED_SUCCESSFULLY}`);
    res.status(200).json({ message: Message.PROFILE_UPDATED_SUCCESSFULLY, user: updatedUser });
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR} ${req.user.id}: ${error.message}`);
    res.status(500).json({ message: Message.SERVER_ERROR, error: error.message });
  }
};


export { upload };

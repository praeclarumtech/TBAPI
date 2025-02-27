import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message } from '../utils/constant/message.js';

const uploadDir = 'src/uploads/profile';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const attachmentUploadDir = 'src/uploads/emailAttachments';
if (!fs.existsSync(attachmentUploadDir)) {
  fs.mkdirSync(attachmentUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  },
}).single('profilePicture');


export const uploadAttachments = multer({
  storage: attachmentStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedAttachmentTypes = ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4', ' application/pdf', 'application/msword', 'application/vnd.ms-excel', 'application/zip']
    if (allowedAttachmentTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  }
}).single('file')

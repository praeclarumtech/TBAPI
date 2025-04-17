import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

const uploadDir = 'src/uploads/profile';
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

const resumeUploadDir = 'src/uploads/resumes';
if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  },
}).single('resume');

export const uploadCv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.info('Invalid file type:', file.mimetype);
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  },
}).single('csvFile');

const uploadAttachmentsDir = 'src/uploads/Attachments';
if (!fs.existsSync(uploadAttachmentsDir)) {
  fs.mkdirSync(uploadAttachmentsDir, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadAttachmentsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const uploadAttachments = multer({
  storage:attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // up to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(Message.INVALID_FILE_TYPE));
    }
  },
}).array('attachments', 5);

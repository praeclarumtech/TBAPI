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

// const uploadAttachmentsDir = 'src/uploads/Attachments';
const uploadAttachmentsDir = path.join('src', 'uploads', 'Attachments');;
if (!fs.existsSync(uploadAttachmentsDir)) {
  fs.mkdirSync(uploadAttachmentsDir, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadAttachmentsDir);
  },
  filename: (req, file, cb) => {
    cb(null,file.originalname);
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

const UPLOAD_CONFIG = {
  RESUME_UPLOAD_DIR: 'src/uploads/resumes',
  MAX_FILE_SIZE: 800 * 1024 * 1024, // 800MB
  MAX_FILES: 100,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  FILENAME_PREFIX: 'resume'
};

const ensureUploadDirExists = () => {
  try {
    if (!fs.existsSync(UPLOAD_CONFIG.RESUME_UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_CONFIG.RESUME_UPLOAD_DIR, { recursive: true });
      logger.info(`Created upload directory: ${UPLOAD_CONFIG.RESUME_UPLOAD_DIR}`);
    }
  } catch (error) {
    logger.error(`Failed to create upload directory: ${error.message}`);
    throw new Error('Failed to initialize upload directory');
  }
};

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDirExists();
    cb(null, UPLOAD_CONFIG.RESUME_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${UPLOAD_CONFIG.FILENAME_PREFIX}${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const resumeFileFilter = (req, file, cb) => {
  try {
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      logger.warn(`Rejected file type: ${file.mimetype} for ${file.originalname}`);
      return cb(new Error(Message.INVALID_FILE_TYPE), false);
    }
    cb(null, true);
  } catch (error) {
    logger.error(`File filter error: ${error.message}`);
    cb(error, false);
  }
};

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      logger.warn(`File size limit exceeded: ${err.message}`);
      return res.status(413).json({
        success: false,
        message: Message.FILE_TOO_LARGE
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      logger.warn(`File count limit exceeded: ${err.message}`);
      return res.status(413).json({
        success: false,
        message: Message.TOO_MANY_FILES
      });
    }
  } else if (err) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || Message.UPLOAD_FAILED
    });
  }
  next();
};

export const uploadResume = multer({
  storage: resumeStorage,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: UPLOAD_CONFIG.MAX_FILES
  },
  fileFilter: resumeFileFilter
}).array('resume', UPLOAD_CONFIG.MAX_FILES); 


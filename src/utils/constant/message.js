export const Message = {
  // connection messages
  MONGODB_CONNECTED: 'MongoDB connected.',
  MONGODB_CONNECTION_ERROR: 'MongoDB connection error.',

  FILE_TOO_LARGE: 'File size exceeds maximum allowed limit.',
  TOO_MANY_FILES: 'Maximum number of files exceeded.',
  UPLOAD_FAILED: 'File upload failed.',
  INVALID_FILENAME: 'Filename contains invalid characters.',

  // error
  ALREADY_EXIST: 'already exist.',
  NOT_FOUND: 'not found.',
  INVALID_CREDENTIALS: 'Invalid credentials.',
  ERROR: 'Error',

  // token messages
  NO_TOKEN: 'Authorization header is missing.',
  TOKEN_IS_NOT_VALID: 'Token is not valid.',

  ADDED_SUCCESSFULLY: 'added successfully.',
  DELETED_SUCCESSFULLY: 'deleted successfully.',
  UPDATED_SUCCESSFULLY: 'updated successfully.',
  REGISTERED_SUCCESSFULLY: 'Congratulations! You are registered successfully.',
  USER_LOGGED_IN_SUCCESSFULLY: 'User logged in successfully.',
  UNABLE_TO: 'Unable to',
  FAILED_TO: 'Failed to',
  MAIL_SENT: 'Mail sent successfully.',
  OTP_SEND: 'OTP sent successfully.',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPG, JPEG, and PNG are allowed.',
  INVALID_FILE_TYPE_RESUME:
    'Invalid file type. Only PDF, DOC, and DOCX are allowed for resumes.',
  INVALID_FILE_TYPE_ATTACHMENT:
    'Invalid file type. Only JPG, PNG, PDF, DOC, and DOCX are allowed for attachments.',
  FETCH_SUCCESSFULLY: 'fetched successfully.',
  FETCHING_COUNTRIES: 'Countries fetched successfully.',
  OBJ_ID_NOT_FOUND:
    'IDs are required or invalid. Provide a non-empty array of valid IDs.',
  OLD_PASSWORD_INCORRECT: 'Old password is incorrect.',
  PASSWORD_MISMATCH: 'Password mismatch.',
  LISTENING_TO_PORT: 'Listening to port.',
  PASSWORD_CHANGE_SUCCESSFULLY: 'Password successfully changed.',
  FIELD_REQUIRED: 'is required.',
  FETCH_BY_ID: 'fetched successfully.',
  OTP_NOT_MATCHED: 'OTP not matched.',
  OTP_MATCHED: 'OTP matched.',
  OTP_EXPIRED: 'Your OTP has expired.',
  FORGOT_SUCCESSFULLY: 'forgot successfully.',
  ENTER_CALENDAR_TYPE:
    'Provide a calendarType (week, month, year) or both startDate and endDate.',
  DOWNLOADED: 'File downloaded successfully.',
  IMPORTED: 'File imported successfully.',
  ACTIVE_SUCCESSFULLY: 'activated successfully.',
  INACTIVE_SUCCESSFULLY: 'deactivated successfully.',
  MOVED_SUCCESSFULLY: 'Records successfully moved to applicants.',
  DUPLICATE_RECORDS: 'All records are duplicates.',
  ADD_TO_FAV: 'added to favorites successfully.',
  UNSUPPORTED_FILE: 'Unsupported file type.',
  RESUME_SCORED_SUCCESSFULLY: 'Resume evaluation completed successfully.',
  ACCESS_DENIED: 'Access denied.',
  UNDER_APPROVAL:
    'Your account is under approval, you will be notified once it is activated.',
  SENT_SUCCESSFULLY: 'sent successfully.',
  IN_COMPLETE: 'To continue, please complete your profile first.',
};

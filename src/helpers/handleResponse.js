import { StatusCodes } from "http-status-codes";
import { Message } from "../utils/message.js";

export function HandleResponse(res, success, statusCode, message, data, error) {
  if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    const finalMessage = message || Message.SERVER_ERROR;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success,
      message: finalMessage,
      error,
    });
  }

  return res.status(StatusCodes.OK).json({
    success,
    statusCode,
    message,
    data,
    error,
  });
}

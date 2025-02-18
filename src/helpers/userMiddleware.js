import jwt from 'jsonwebtoken';
import { Message } from '../utils/message.js';

export const authorization = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: Message.NO_TOKEN });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: Message.TOKEN_ISnNOT_VALID });
  }
};
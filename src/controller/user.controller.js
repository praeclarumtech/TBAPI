import { Message } from '../utils/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import { createUser, getUser } from '../services/user.service.js';

export const register = async (req, res, next) => {
  let { userName, email, password, role } = req.body;
  try {


    const existingUser = await getUser({ email });
    if (existingUser) {
      logger.warn(`${Message.USER_ALREADY_EXISTS}: ${email}`);
      return res
        .status(409)
        .json({ success: true, message: Message.ALREADY_EXIST });
    }
    await createUser({ userName, email, password, role });

    logger.info(Message.REGISTERED_SUCCESSFULLY); 
    return res
      .status(201)
      .json({ success: true, message: Message.REGISTERED_SUCCESSFULLY });
  } catch (error) {
    logger.error(`${Message.REGISTRATION_ERROR}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: Message.REGISTRATION_ERROR});
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUser({ email });
    if (!user) {
    logger.info(`${Message.USER_NOT_FOUND}: ${email}`);
      return res.status(400).json({ success: true, message: Message.USER_NOT_FOUND });}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch){
      logger.info(`${Message.INVALID_CREDENTIALS}: ${email}`);
      return res.status(400).json({ message: Message.INVALID_CREDENTIALS });}

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (error) {

    res.status(500).json({ error: error.message });
  }
};

import { Message } from "../utils/message.js";
import { createUser, getUser } from "../services/user.service.js";

export const register = async (req, res) => {
  let { userName, email, password, role } = req.body;
  try {
    const existingUser = await getUser({ email });

    if (existingUser) {
      return res
        .status(409)
        .json({ success: true, message: Message.ALREADY_EXIST });
    }
    await createUser({ userName, email, password, role });

    return res
      .status(201)
      .json({ success: true, message: Message.REGISTERED_SUCCESSFULLY });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import dotenv from 'dotenv';
import axios from 'axios';
import logger from '../loggers/logger.js';

dotenv.config();

const CLICK_SEND_USERNAME = process.env.CLICK_SEND_USERNAME;
const CLICK_SEND_API_KEY = process.env.CLICK_SEND_API_KEY;
const CLICK_SEND_URL = 'https://rest.clicksend.com/v3/sms/send';

if (!CLICK_SEND_USERNAME || !CLICK_SEND_API_KEY) {
  logger.error('Error: ClickSend credentials are missing. Check .env file.');
  process.exit(1);
}

export const sendSMS = async (phoneNumbers, message) => {
  try {
    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error('Phone number list is empty.');
    }

    const messages = phoneNumbers.map((number) => ({
      to: number.startsWith('+') ? number : `+${number}`,
      body: message,
    }));

    const response = await axios.post(
      CLICK_SEND_URL,
      { messages },
      {
        auth: {
          username: CLICK_SEND_USERNAME,
          password: CLICK_SEND_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('SMS sent successfully', {
      response: response.data,
      recipients: phoneNumbers,
      message,
    });
    return response.data;
  } catch (error) {
    logger.error('Error sending SMS', {
      error: error.response?.data || error.message,
    });
    throw error;
  }
};

import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
} from "../services/applicantService.js";
import { Message } from "../utils/message.js";
import logger from "../loggers/logger.js";
import { generateApplicantNo } from "../helpers/generateApplicationNo.js";

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { first, middle, last },
      ...body
    } = req.body;
    const application_No = await generateApplicantNo();
    const applicantData = {
      application_No,
      name: { first, middle, last },
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`${Message.APPLICANT_SUBMIT_SUCCESSFULLY}: ${applicant._id}`);
    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    logger.error(`${Message.ERROR_ADDING_AAPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: Message.ERROR_ADDING_AAPLICANT, error });
  }
};

export const viewAllApplicant = async (req, res) => {
  try {
    const applicants = await getAllapplicant();
    logger.info(Message.FETCHED_ALL_APPLICANTS);
    res.json(applicants);
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: Message.ERROR_RETRIEVING_APPLICANTS, error });
  }
};

export const viewApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getApplicantById(applicantId);

    if (!applicant) {
      logger.warn(`${Message.APPLICANT_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.APPLICANT_NOT_FOUND });
    }
    logger.info(`${Message.FETCHED_APPLICANT_SUCCESSFULLY}: ${applicantId}`);
    res.json(applicant);
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: Message.ERROR_RETRIEVING_APPLICANTS, error });
  }
};

export const updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const {
      name: { first, middle, last },
      ...body
    } = req.body;

    let updateData = { name: { first, middle, last }, ...body };
    const updatedApplicant = await updateApplicantById(applicantId, updateData);

    if (!updatedApplicant) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    logger.info(`${Message.UPDATED_SUCCESSFULLY}: ${applicantId}`);
    res.json(updatedApplicant);
  } catch (error) {
    logger.error(`${Message.ERROR_UPDATING_APPLICANT}: ${error.message}`);
    res.status(500).json({ message: Message.ERROR_UPDATING_APPLICANT, error });
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getApplicantById(applicantId);

    if (!applicant) {
      logger.warn(`${Message.APPLICANT_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.APPLICANT_NOT_FOUND });
    }

    await applicant.deleteOne();
    logger.info(`${Message.APPLICANT_DELETED_SUCCESSFULLY}: ${applicantId}`);
    res.json({ message: Message.APPLICANT_DELETED_SUCCESSFULLY });
  } catch (error) {
    logger.error(`${Message.ERROR_DELETING_APPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: Message.ERROR_DELETING_APPLICANT, error });
  }
};

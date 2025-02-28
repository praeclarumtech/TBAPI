import { createWhatsAppGroupsService, getAllWhatsAppGroupsService } from "../services/whatsappService.js";
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from "http-status-codes";
import logger from '../loggers/logger.js';

export const createWhatsAppGroups = async (req, res) => {
  try {
    const {group_name, applicant_id } = req.body;
    const user_id = req.user.id;

    if (!group_name || typeof group_name !== "string" || group_name.trim() === "") {
        logger.error("Group name is required.");
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, "Group name is required.");
      }
  
      const newGroup = await createWhatsAppGroupsService(group_name, applicant_id, user_id);
      logger.info("WhatsApp group created successfully.");
  
      return HandleResponse(res, true, StatusCodes.CREATED, "WhatsApp group created successfully.", newGroup);
    } catch (error) {
      logger.error("Error creating WhatsApp group:", error);
      return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };


  export const getAllWhatsAppGroups = async (req, res) => {
    try {
      const groups = await getAllWhatsAppGroupsService();
      logger.info("Fetched all WhatsApp groups successfully.");
      
      return HandleResponse(res, true, StatusCodes.OK, "WhatsApp groups fetched successfully.", groups);
    } catch (error) {
      logger.error("Error fetching WhatsApp groups:", error);
      return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch WhatsApp groups.");
    }
  };


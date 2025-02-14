import { getAllcountry } from "../services/commonService.js";

export const viewCountry = async (req, res) => {
    try {
      const  country = await getAllcountry();
      res.status(200).json(country);
    } catch (error) {
        logger.error(` ${error.message}`, {stack: error.stack,});
        res.status(500).json({ success: false, error});
    }
  };
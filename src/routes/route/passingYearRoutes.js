import express from "express";
import {
  addYear,
  getYearById,
  getYears,
  updateYear,
  deleteYear,
} from "../../controller/passingYear.controller.js";
import {
  validateId,
  passingYearValidation,
} from "../../validations/yearsValidation.js";
import { validator } from "../../helpers/validator.js";

const router = express.Router();

router.post("/", validator.body(passingYearValidation), addYear);
router.get("/listOfYears", getYears);
router.get("/getYearById/:id", validator.params(validateId), getYearById);
router.put(
  "/updateYear/:id",
  validator.params(validateId),
  validator.body(passingYearValidation),
  updateYear
);
router.delete("/deleteYear/:id", validator.params(validateId), deleteYear);

export default router;

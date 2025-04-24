import Skills from '../models/skillsModel.js';
import {
  create,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkillById,
} from '../services/skillsService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import { uploadCv } from '../helpers/multer.js';

export const addSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills || typeof skills !== "string") {
    logger.warn(`skills is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Skills ${Message.FIELD_REQUIRED}`
    );
  }

  const normalizeSkill = (str) => str.toLowerCase().replace(/\s+/g, '');
  const normalizedInput = normalizeSkill(skills);
  try {

    const allSkills = await Skills.find({ isDeleted: false });
    const existingSkill = allSkills.find(s => normalizeSkill(s.skills) === normalizedInput);

    if (existingSkill) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Skill ${Message.ALREADY_EXIST}!`
      );
    }

    const result = await create({ skills: skills.trim() });
    logger.info(`Skills is ${Message.ADDED_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Skills is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add skills.`
    );
  }
};

export const getSkills = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(500, Math.max(1, parseInt(req.query.limit))) || 10;
    let search = req.query.search || "";

    let data;
    let totalRecords;

    if (search) {
      const searchFields = ['skills'];
      const searchResult = await commonSearch(Skills, searchFields, search,);
      data = searchResult.results;
      totalRecords = searchResult.totalRecords;
    } else {
      totalRecords = await Skills.countDocuments({ isDeleted: false });
      data = await getAllSkills(page, limit);
    }

    logger.info(`All skills are ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All skills are ${Message.FETCH_SUCCESSFULLY}`,
      {
        data,
        pagination: {
          totalRecords: totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          limit: limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch skills.`
    );
  }
};
export const getSkillsById = async (req, res) => {
  const { skillId } = req.params;
  try {
    const result = await getSkillById(skillId);
    if (!result) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`Skill is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Skill is ${Message.FETCH_BY_ID}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch skills by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch skills by id.`
    );
  }
};

export const updateSkills = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updateData = req.body;

    const updatedSkill = await updateSkill(skillId, updateData);

    if (!updatedSkill) {
      logger.warn(`Skill is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Skill is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Skills is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Skills is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedSkill
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update skills.`
    );
  }
};

export const deleteSkills = async (req, res) => {
  try {
    const { skillId } = req.params;
    const deletedSkill = await deleteSkillById(skillId, {
      isDeleted: true,
    });

    if (!deletedSkill) {
      logger.warn(`Skill is ${Message.NOT_FOUND}`)
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Skill is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`year ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `year is ${Message.DELETED_SUCCESSFULLY}`,
      deletedSkill
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete skills.`
    );
  }
};

export const importSkillsCsv = async (req, res) => {
  try {
    uploadCv(req, res, async (err) => {
      if (err || !req.file) {
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, `${Message.FAILED_TO} upload CSV`);
      }
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser({ skipEmptyLines: true }))
        .on('data', (row) => {
          if (row.skills && row.skills.trim() !== '') {
            results.push({ skills: row.skills.trim() });
          }
        })
        .on('end', async () => {
          try {
            const skillRegexes = results.map(skill => ({
              skills: { $regex: `^${skill.skills.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            }));
            const existingSkills = await Skills.find({ $or: skillRegexes }).lean();

            const existingSkillNames = existingSkills.map(skill => skill.skills.toLowerCase());

            const newSkills = results.filter(skill =>
              !existingSkillNames.includes(skill.skills.toLowerCase())
            );
            const duplicateSkills = results.filter(skill =>
              existingSkillNames.includes(skill.skills.toLowerCase())
            );
            if (duplicateSkills.length) {
              const duplicatesList = duplicateSkills.map(s => s.skills).join(', ');
              fs.unlinkSync(req.file.path);
              if (duplicateSkills.length > 1) {
                return HandleResponse(res, false, StatusCodes.CONFLICT, `${duplicatesList} Are already exist.`)
              } else {
                return HandleResponse(res, false, StatusCodes.CONFLICT, `${duplicatesList} is already exist.`)
              }
            }
            if (newSkills.length) {
              await Skills.insertMany(newSkills).catch(error => {
              });
            }
            fs.unlinkSync(req.file.path);
            return HandleResponse(res, true, StatusCodes.OK, 'CSV imported successfully.', {
              insertedSkills: newSkills,
            });
          } catch (dbError) {
            fs.unlinkSync(req.file.path);
            return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to import skills.");
          }
        })
        .on('error', (error) => {
          fs.unlinkSync(req.file.path);
          return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        });
    });
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} import CSV`
    );
  }
};




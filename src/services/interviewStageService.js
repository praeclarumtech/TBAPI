import interviewStage from "../models/interviewstageModel.js";

export const create = async (body) => {
  try {
    const interviewStages = new interviewStage({ ...body });
    return await interviewStages.save();
  } catch (error) {
    throw new Error(`Failed to create interviewStage: ${error.message}`);
  }
};

export const getAllInterviewStage = async (page, limit) => {
  try {
    return await interviewStage.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    throw new Error(`Failed to fetch interviewStage: ${error.message}`);
  }
};

export const getInterviewStageById = async (id) => {
  try {
    return await interviewStage.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    throw new Error(`Failed to get interviewStage by ID: ${error.message}`);
  }
};

export const updateInterviewStage = async (id, updateData) => {
  try {
    return await interviewStage.updateOne({ _id: id }, updateData);
  } catch (error) {
    throw new Error(`Failed to update interviewStage: ${error.message}`);
  }
};

export const deleteInterviewStageById = async (id) => {
  try {
    return await interviewStage.deleteOne({ _id: id });
  } catch (error) {
    throw new Error(`Failed to delete interviewStage: ${error.message}`);
  }
};

export const removeManyInterviewStage = async (ids) => {
  try {
    return await interviewStage.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    throw new Error(`Failed to delete multiple interviewStage: ${error.message}`);
  }
};

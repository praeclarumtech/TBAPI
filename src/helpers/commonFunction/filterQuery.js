import { applicantEnum } from '../../utils/enum.js';

export const buildApplicantQuery = (params) => {
  const {
    applicationNo,
    applicantName,
    appliedSkills,
    totalExperience,
    startDate,
    endDate,
    currentCity,
    interviewStage,
    expectedPkg,
    noticePeriod,
    status,
    gender,
    currentCompanyDesignation,
    state,
    workPreference,
    anyHandOnOffers,
    rating,
    communicationSkill,
  } = params;

  let query = { isDeleted: false };

  if (applicationNo && !isNaN(applicationNo)) query.applicationNo = parseInt(applicationNo);

  if (appliedSkills) {
    const skillsArray = appliedSkills.split(',').map(skill =>
      new RegExp(`^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    );
    query.appliedSkills = { $all: skillsArray };
  }

  if (totalExperience) {
    const rangeMatch = totalExperience.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[3]);
      query.totalExperience = { $gte: min, $lte: max };
    } else {
      query.totalExperience = parseFloat(totalExperience);
    }
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
    if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  if (currentCity) query.currentCity = { $regex: new RegExp(currentCity, 'i') };
  if (interviewStage) query.interviewStage = interviewStage;

  if (expectedPkg) {
    const rangeMatch = expectedPkg.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[3]);
      query.expectedPkg = { $gte: min, $lte: max };
    } else {
      query.expectedPkg = parseFloat(expectedPkg);
    }
  }

  if (noticePeriod) {
    const rangeMatch = noticePeriod.toString().match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      query.noticePeriod = { $gte: min, $lte: max };
    } else {
      query.noticePeriod = parseInt(noticePeriod);
    }
  }

  if (gender) query.gender = gender;
  if (status) query.status = status;
  if (currentCompanyDesignation) query.currentCompanyDesignation = currentCompanyDesignation;
  if (state) query.state = { $regex: new RegExp(state, 'i') };
  if (workPreference) query.workPreference = workPreference;

  if (anyHandOnOffers !== undefined) {
    query.anyHandOnOffers = anyHandOnOffers === 'true';
  }

  if (rating) {
    const rangeMatch = rating.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[3]);
      query.rating = { $gte: min, $lte: max };
    } else {
      query.rating = parseFloat(rating);
    }
  }

  if (communicationSkill) {
    const rangeMatch = communicationSkill.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[3]);
      query.communicationSkill = { $gte: min, $lte: max };
    } else {
      query.communicationSkill = parseFloat(communicationSkill);
    }
  }

  return query;
};

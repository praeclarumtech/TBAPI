


const Applicant = require("../models/Applicant");
const generateApplicantNo = require("../utils/generateApplicationNo");

exports.addApplicant = async (req, res) => {
  try {
    const { first, middle, last } = req.body.name;
    const application_No = await generateApplicantNo();

    const applicant = new Applicant({ application_No, name: { first, middle, last }, ...req.body });
    await applicant.save();
    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ message: "Error adding applicant", error });
  }
};

exports.updateApplicant = async (req, res) => {
  try {
    const updatedApplicant = await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedApplicant);
  } catch (error) {
    res.status(500).json({ message: "Error updating applicant", error });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    await Applicant.findByIdAndDelete(req.params.id);
    res.json({ message: "Applicant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting applicant", error });
  }
};

exports.viewApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    res.json(applicant);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving applicant", error });
  }
};
exports.viewAllApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find();
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving applicants", error });
  }
};
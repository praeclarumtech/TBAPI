const skillsdb = require("../models/model");
const addSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills) {
    return res.status(400).json({ error: "Skills field is required" });
  }
  try {
    const result = await skillsdb.create({ skills });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSkills = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
    const totalRecords = await skillsdb.countDocuments();
    const getskills = await skillsdb
      .find()
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({
      success: true,
      data: getskills,
      pagination: {
        totalRecords: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit: limit,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSkillsById = async (req, res) => {
  const { skillId } = req.params;
  try {
    
    const result = await skillsdb.findById(skillId);
    if (!result) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSkills = async (req, res) => {
  
  // const { skills } = req.body;
  // if (!skills) {
  //   return res.status(400).json({ error: "Skills field is required" });
  // }
  try {
    const { skillId} = req.params.id;
    const result = await skillsdb.findByIdAndUpdate(
      skillId,
      { skillId },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSkills = async (req, res) => {
  try {
      const {skillId} = req.params;

      const data = await skillsdb.findByIdAndUpdate(
        {_id: skillId},
        { isdeleted: true },
        { new: true }
      );

      res.status(200).json({
        success:true,
        message:"Deleted Successfully",
        data
      })
  } catch (error) {
    res.status(500).json({
      success:true,
      message:"something went wrong",
    })
  }
}


module.exports = { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById };
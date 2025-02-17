const admindb =require('../models/Admin.model');
const { createadmin, getadmin, updateadmin, deleteadmin, getadminById, loginadmin } = require('../../routes/route/admin.route');
const createadmin = async (req, res) => {
  try {
    res.send('Admin created successfully');
    const {firstname,lastname,email,username,password,mobile,address} = req.body;
    

    const result = await admindb.create({firstname,lastname,email,username,password,mobile,address});
    res.status(200).json({ success: true, data: result });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getadmin = async (req, res) => {
    try {
      let page = Math.max(1, parseInt(req.query.page)) || 1;
      let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
      const totalRecords = await admindb.countDocuments();
      const getadmin = await admindb
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      res.status(200).json({
        success: true,
        data: getadmin,
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


  const getadminById = async (req, res) => {
    const { adminId } = req.params;
    try {
      
      const result = await admindb.findById(adminId);
      if (!result) {
        return res.status(404).json({ error: "admin not found" });
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  const updateadmin = async (req, res) => {
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
  

  const deleteadmin = async (req, res) => {
    try {
        const {adminId} = req.params;
  
        const data = await admindb.findByIdAndUpdate(
          {_id: adminId},
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
     

  const loginadmin = async (req, res) =>{
    const {email,username,password} = req.body;
    try{
      const admin = await getadmin({email,username,password});
      if(!admin){
        return res.status(400).json({success: true, message: "Invalid Credentials"});}

        const isMatch = await bcrypt.compare(password, admin.password);
        if(!isMatch){
          return res.status(400).json({message: message, message: "Invalid Credentials"});}


          const token = jwt.sign(
            { id: adminname._id,role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.json({token});
        }catch(error){
          res.status(500).json({error: error.message});
        }
  
  };
  
  module.exports = { createadmin, getadmin, updateadmin, deleteadmin, getadminById, loginadmin };
  

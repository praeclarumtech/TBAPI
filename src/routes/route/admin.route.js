const express = require("express");
const router = express.Router();

// const adminControllerConfig = {
//     type: typeof adminControllerConfig
// };

const adminController = require('../../controller/Admin.controller');


  const { createadmin, getadmin, updateadmin, deleteadmin, getadminById, loginadmin  } = require('../../routes/route/admin.route');   


router.post("/createadmin", createadmin);
router.get("/listOfadmin", getadmin);
router.get("/:adminId", getadminById);
router.put("/:adminid", updateadmin);
router.delete("/:adminId", deleteadmin);
router.post("/login", loginadmin);

module.exports = router;
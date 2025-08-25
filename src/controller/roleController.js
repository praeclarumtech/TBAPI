import Role from "../models/roleModel.js";
import logger from "../loggers/logger.js";  

export const createRole = async (req, res) => {
  try {
    const newRole = new Role(req.body);
    await newRole.save();

    logger.info(`Role created: ${newRole._id}`);
    res.status(201).json(newRole);
  } catch (error) {
    logger.error(`Create role failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};


export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    logger.error(`Get roles failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      logger.warn(`Role not found: ${req.params.id}`);
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json(role);
  } catch (error) {
    logger.error(`Get role by ID failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};


export const updateRole = async (req, res) => {
  try {

    const role = await Role.findByIdAndUpdate(req.params.id, { new: true });
    if (!role) {
      logger.warn(`Update failed - Role not found: ${req.params.id}`);
      return res.status(404).json({ message: "Role not found" });
    }

    logger.info(`Role updated: ${role._id}`);
    res.status(200).json(role);
  } catch (error) {
    logger.error(`Update role failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};


export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      logger.warn(`Delete failed - Role not found: ${req.params.id}`);
      return res.status(404).json({ message: "Role not found" });
    }

    logger.info(`Role deleted: ${role._id}`);
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    logger.error(`Delete role failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};

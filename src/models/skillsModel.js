import mongoose from 'mongoose';
import { skillGroupEnum } from '../utils/enum.js';

const skillsSchema = new mongoose.Schema(
  {
    skills: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(skillGroupEnum),
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Skills = mongoose.model('Skills', skillsSchema);
export default Skills;

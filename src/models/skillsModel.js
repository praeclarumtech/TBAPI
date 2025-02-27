import mongoose from 'mongoose';

const skillsSchema = new mongoose.Schema(
  {
    skills: {
      type: String,
      unique: true,
      required: true,
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

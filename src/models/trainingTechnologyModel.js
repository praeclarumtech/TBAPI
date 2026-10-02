import mongoose from 'mongoose';

const trainingTechnologySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trainingTechnologySchema.index({ isDeleted: 1, name: 1 });
trainingTechnologySchema.index({ createdAt: -1 });

const TrainingTechnology = mongoose.model(
  'TrainingTechnology',
  trainingTechnologySchema
);

export default TrainingTechnology;

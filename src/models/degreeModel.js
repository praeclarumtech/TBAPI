import mongoose from 'mongoose';

const degreeSchema = new mongoose.Schema(
    {
        degree: {
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

const Degree = mongoose.model('Degree', degreeSchema);
export default Degree;

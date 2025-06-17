import mongoose from 'mongoose';
import { jodTypeEnum, timeZome } from '../utils/enum.js';

const jobSchema = new mongoose.Schema(
    {
        job_id: { type: String, unique: true },
        job_subject: { type: String, required: false },
        job_details: { type: String, required: false },
        job_type: {
            type: String,
            enum: [jodTypeEnum.FULL_TIME, jodTypeEnum.PART_TIME, jodTypeEnum.CONTRACT, jodTypeEnum.FREELANCE, jodTypeEnum.INTERNSHIP],
            required: false
        },
        time_zone: {
            type: String,
            enum: [timeZome.IST, timeZome.EST, timeZome.UTC],
            required: false
        },
        start_time: { type: String, required: false },
        end_time: { type: String, required: false },
        min_salary: { type: Number, required: false },
        max_salary: { type: Number, required: false },
        contract_duration: { type: String, required: false },
        addedBy: { type: String }
    },
    { timestamps: true }
);

const jobs = mongoose.model('jobs', jobSchema, 'job');

export default jobs;
import mongoose from 'mongoose';
import { applicantEnum, jodTypeEnum, salaryCurrencyEnum, salaryFrequencyEnum, timeZome } from '../utils/enum.js';

const jobSchema = new mongoose.Schema(
    {
        job_id: { type: String, unique: true },
        job_subject: { type: String, required: false },
        job_details: { type: String, required: false },
        sub_description : { type: String, required: false },
        job_type: {
            type: String,
            enum: Object.values(jodTypeEnum),
            required: false
        },
        time_zone: {
            type: String,
            enum: Object.values(timeZome),
            required: false
        },
        salary_currency: {
            type: String,
            enum: Object.values(salaryCurrencyEnum),
            default: 'INR'
        },
        salary_frequency: {
            type: String,
            enum: Object.values(salaryFrequencyEnum),
            required: false
        },
        min_experience: {
            type: Number,
            required: false
        },
        work_preference: {
            type: String,
            enum: [applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE, '']
        },
        required_skills: { type: [String], required: false },
        application_deadline: {
            type: Date,
            required: false
        },
        job_location: {
            type: String,
            required: false
        },
        isActive: { type: Boolean, default: true },
        start_time: { type: String, required: false },
        end_time: { type: String, required: false },
        min_salary: { type: Number, required: false },
        max_salary: { type: Number, required: false },
        contract_duration: { type: String, required: false },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

const jobs = mongoose.model('jobs', jobSchema, 'job');

export default jobs;
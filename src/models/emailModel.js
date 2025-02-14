import mongoose from "mongoose";

const  applicantEmailSchema = new mongoose.Schema({
    email_to:{
        type:String,
        required:true
    },
    email_bcc:{
        type:String,
        required:true
    },
    subject:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
}, {timestamps: true,}
)

const applicant_email = mongoose.model('applicant_email',applicantEmailSchema)
export default applicant_email

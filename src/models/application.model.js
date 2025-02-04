import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    applicationNo: { 
        type: String, 
        unique: true 
    },
    firstName: { 
        type: String, 
        required: true 
    },
    middleName: { 
        type: String 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        required: true 
    },
    whatsappNumber: { 
        type: String, 
        required: true 
    },
    dateofbith: { 
        type: Date 
    },
    email: { 
        type: String, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'] 
    },
    state: { 
        type: String 
    },
    country: { 
        type: String 
    },
    pincode: { 
        type: String 
    },
    fullcurrentaddress: { 
        type: String 
    },
    qualification: { 
        type: String 
    },
    degreeName: { 
        type: String 
    },
    passingYear: { 
        type: Number 
    },
});

const application = mongoose.model("applicant", applicationSchema);
export default application;

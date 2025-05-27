import mongoose from 'mongoose';

const duplicateRecordSchema = new mongoose.Schema(
    {
        fileName: {
            type: String
        },
        reason:{
            type: String
        },
        email:{
             type: String
        }
    },
    {
        timestamps: true,
    }
);

const duplicateRecord = mongoose.model('duplicateRecord', duplicateRecordSchema);
export default duplicateRecord;

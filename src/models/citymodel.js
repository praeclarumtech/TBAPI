import mongoose from 'mongoose';        


const citySchema = new mongoose.Schema(
    {
        city_name : {
            type: String,
            required: true,
        },
        state_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'state',
            required: true
        }
    }
);

const city = mongoose.model('city', citySchema, 'city');

export default city;
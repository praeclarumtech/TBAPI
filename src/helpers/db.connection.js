import mongoose from 'mongoose'
import dotenv from 'dotenv';
import { Message } from '../utils/constant/passingYearMessage.js';
dotenv.config();


const connectDb = async()=>{
    try {
         await mongoose.connect(process.env.URI)
        console.log(Message.DB_CONN)
    } catch (error) {
        console.log(Message.DB_CONN_ERR)
    }
}

export default connectDb
const mongoose = require("mongoose");


const connectDb = async()=>{
    try {
        const connection = await mongoose.connect("mongodb://localhost:27017/TALENTBOX");
        console.log("database connected")
    } catch (error) {
        console.log("connectio error")
    }
}

module.exports = connectDb
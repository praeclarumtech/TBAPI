const mongoose = require('mongoose')
require('dotenv').config()

const connectDb = async()=>{
    try {
        const connection = await mongoose.connect(process.env.URI)
        console.log(`database connected:${connection.connection.host}`)
    } catch (error) {
        console.log("database connection error",error)
    }
}

module.exports = connectDb
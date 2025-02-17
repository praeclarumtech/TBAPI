const mongoose=require('mongoose'); 
const adminSchema=new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    mobile:{
        type:Number,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
})

const admin=mongoose.model('admin',adminSchema);
module.exports=admin;   
const mongoose=require('mongoose'); 

const skillsSchema=new mongoose.Schema({
skills:{
type:String,
required:true,
},
isdeleted:{
type:Boolean,
default:false,
},
createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },

});

const skills=mongoose.model('skills',skillsSchema);
module.exports=skills;
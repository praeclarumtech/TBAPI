const mongoose = require("mongoose");

const passingYearSchema = new mongoose.Schema(
  {
    year:{
      type: Number
    },
    is_deleted: {
      type : Boolean,
      default: false
    }
  },
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("passingYear", passingYearSchema);

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  phoneNumber: {
    type: String,
    unique: true,
    trim: true,          
    minlength: 10,       
    maxlength: 15        
  }, 
  email: { type: String, unique: true },
  dob: { type: Date},
  profilePhoto: { type: String },
  aadharNumber: { type: String },
  panNumber: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);

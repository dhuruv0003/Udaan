const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First Name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last Name is required']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,          
    minlength: 10,       
    maxlength: 15        
  },  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  dob: {
    type: Date,
    required: [true, 'Date of Birth is required']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

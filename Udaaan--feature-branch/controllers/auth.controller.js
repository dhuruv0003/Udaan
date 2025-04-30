const User = require('../Model/user.model');
const bcrypt = require('bcrypt');
const ErrorResponse = require('../utils/error.response');
const profileModel = require('../Model/profile.model');
const { sendOTP } = require('../services/sms.service');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, email, dob } = req.body;

    // Validate all required fields
    if (!firstName || !lastName || !phoneNumber || !email || !dob) {
      return next(new ErrorResponse('All fields are required', 400));
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(new ErrorResponse('Invalid phone number format', 400));
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return next(new ErrorResponse('User already registered with this email or phone', 400));
    }

    // Create new unverified user
    const newUser = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      dob,
      isVerified: false
    });

    if (!newUser) {
      return next(new ErrorResponse('Failed to create user', 500));
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

    newUser.otp = otp;
    newUser.otpExpires = otpExpires;
    await newUser.save();

    // Send OTP via SMS
    try {
      await sendOTP(phoneNumber, `Your verification OTP is ${otp}`);
    } catch (smsError) {
      // Delete the user if SMS fails to avoid orphaned unverified accounts
      await User.deleteOne({ _id: newUser._id });
      return next(new ErrorResponse('Failed to send OTP. Please try again later.', 500));
    }

   
    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone. Verify to complete registration.',
      userId: newUser._id,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate input
    if (!phoneNumber || !otp) {
      return next(new ErrorResponse('Phone number and OTP are required', 400));
    }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check verification status
    if (user.isVerified) {
      return next(new ErrorResponse('User already verified', 400));
    }

    // Verify OTP
    if (user.otp !== otp) {
      return next(new ErrorResponse('Invalid OTP', 400));
    }

    // Check OTP expiry
    if (user.otpExpires < new Date()) {
      return next(new ErrorResponse('OTP expired', 400));
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Update profile verification status
    await profileModel.findOneAndUpdate(
      { userId: user._id },
      { isVerified: true }
    );

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return next(new ErrorResponse('Phone number is required', 400));
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (user.isVerified) {
      return next(new ErrorResponse('User already verified', 400));
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP
    await sendOTP(phoneNumber, `Your new verification OTP is ${otp}`);

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return next(new ErrorResponse('Phone number is required', 400));
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(new ErrorResponse('Invalid phone number format', 400));
    }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User not found. Please register first.', 404));
    }

    // Check verification status
    if (!user.isVerified) {
      return next(new ErrorResponse('Phone number not verified. Please verify your number.', 401));
    }

    // Successful login
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  verifyOTP,
  resendOTP 
};
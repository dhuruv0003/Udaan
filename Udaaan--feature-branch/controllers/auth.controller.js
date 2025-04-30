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

    if (!firstName || !lastName || !phoneNumber || !email || !dob) {
      return next(new ErrorResponse('All fields are required', 400));
    }  

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorResponse('User already registered with this email or phone', 400));
    }

    const newUser = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      dob,
      isActive: true
    });

    if (!newUser) {
      return next(new ErrorResponse('Failed to create user', 500));
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); 

    newUser.otp = otp;
    newUser.otpExpires = otpExpires;
    await newUser.save();

    try {
      await sendOTP(phoneNumber, otp);
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

    if (!phoneNumber || !otp) {
      return next(new ErrorResponse('Phone number and OTP are required', 400));
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

   

    // Verify OTP
    if (user.otp !== otp) {
      return next(new ErrorResponse('Invalid OTP', 400));
    }

    // Check OTP expiry
    if (user.otpExpires < new Date()) {
      return next(new ErrorResponse('OTP expired', 400));
    }


    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

   

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber
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

   
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOTP(phoneNumber, otp);

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    next(error);
  }
};

// const loginUser = async (req, res, next) => {
//   try {
//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: 'Phone number is required' });
//     }
  
//     const phoneRegex = /^[0-9]{10}$/;
//     if (!phoneRegex.test(phoneNumber)) {
//         return next(new ErrorResponse('Invalid phone number format', 400));
//     }

//     // Find user
//     const user = await User.findOne({ phoneNumber });
//      if (user) {
//         return res.status(200).json({
//           message: 'User found',
//           data: {
//             id: user.id,
//             name: user.name,
//             phoneNumber: user.phoneNumber,
//             email: user.email,
//           },
//         });
//       } else {
//         return next(new ErrorResponse('User does not exist', 400));
//       }

//   } catch (error) {
//     next(error);
//   }
// };

const loginUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(new ErrorResponse('Invalid phone number format', 400));
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User does not exist', 400));
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      await sendOTP(phoneNumber, `Your login OTP is ${otp}`);
    } catch (smsError) {
      return next(new ErrorResponse('Failed to send OTP. Please try again later.', 500));
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone. Please verify to login.',
      expiresIn: '10 minutes',
    });

  } catch (error) {
    next(error);
  }
};

const verifyLoginOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return next(new ErrorResponse('Phone number and OTP are required', 400));
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (user.otp !== otp) {
      return next(new ErrorResponse('Invalid OTP', 400));
    }

    if (user.otpExpires < new Date()) {
      return next(new ErrorResponse('OTP expired', 400));
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.firstName + ' ' + user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
};



module.exports = { 
  registerUser, 
  loginUser, 
  verifyOTP,
  resendOTP ,
  verifyLoginOTP
};
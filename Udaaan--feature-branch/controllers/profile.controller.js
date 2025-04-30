const Profile = require('../Model/profile.model'); // tumhara Profile model
const User = require('../Model/user.model');       // tumhara User model
const ErrorResponse = require('../utils/error.response');

const updateProfile = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { profilePhoto, aadharNumber, panNumber, firstName, lastName, dob, phoneNumber } = req.body;

    if (!email) {
      return next(new ErrorResponse('Email is required to update profile.', 400));
    }

    const profile = await Profile.findOne({ email });
    if (!profile) {
      return next(new ErrorResponse('Profile not found', 404));
      
    }

    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (phoneNumber) profile.phoneNumber = phoneNumber;
    if (dob) profile.dob = dob;
    if (profilePhoto) profile.profilePhoto = profilePhoto;
    if (aadharNumber) profile.aadharNumber = aadharNumber;
    if (panNumber) profile.panNumber = panNumber;

    await profile.save(); 

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dob) user.dob = dob;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save(); 

    res.status(200).json({
      message: 'Profile and User updated successfully',
      updatedProfile: profile,
      updatedUser: user
    });

  } catch (error) {
    next(error);
  }
};
const getProfileByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorResponse('Email is required to update profile.', 400));
    }

    const profile = await Profile.findOne({ email });
    if (!profile) {
      return next(new ErrorResponse('Profile not found', 400));
      
    }
    res.status(200).json({
      message: 'Profile retrive successfully',
      profile: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {updateProfile, getProfileByEmail};

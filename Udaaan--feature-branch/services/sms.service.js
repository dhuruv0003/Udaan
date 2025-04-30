const twilio = require('twilio');

const sendOTP = async (phoneNumber, otp) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format numbers properly
    const formattedFrom = process.env.TWILIO_PHONE_NUMBER; // Should be in E.164 format
    
    
    const formattedTo = `+91${phoneNumber}`; // For Indian numbers

    const message = await client.messages.create({
      body: `Your verification OTP is: ${otp}`,
      from: formattedFrom,
      to: formattedTo
    });

    return message.sid;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send OTP via SMS');
  }
};

module.exports = { sendOTP };
/**
 * Real SMS Gateway Service for CivixAI
 * Supports Fast2SMS (India), Twilio (Global), and 2Factor (India)
 */

export const sendRealSms = async ({ phone, otp, message }) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const phone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const fullIndianNumber = cleanPhone.startsWith('91') && cleanPhone.length === 12 
    ? cleanPhone 
    : `91${phone10}`;

  const smsText = message || `Your CivixAI verification OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;

  console.log(`\n=======================================================`);
  console.log(`[SMS SERVICE] Initiating SMS dispatch to +91 ${phone10}`);
  console.log(`[SMS SERVICE] Message Content: "${smsText}"`);
  console.log(`=======================================================\n`);

  // 1. Check Fast2SMS (Preferred for India)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
  if (fast2SmsKey && fast2SmsKey.trim()) {
    try {
      console.log(`[SMS SERVICE] Sending via Fast2SMS OTP route...`);
      const url = new URL('https://www.fast2sms.com/dev/bulkV2');
      url.searchParams.append('authorization', fast2SmsKey.trim());
      url.searchParams.append('route', 'otp');
      url.searchParams.append('variables_values', otp.toString());
      url.searchParams.append('numbers', phone10);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await res.json();
      console.log(`[SMS SERVICE] Fast2SMS Response:`, data);

      if (data.return) {
        return {
          success: true,
          provider: 'Fast2SMS',
          requestId: data.request_id,
          delivered: true,
          message: `SMS delivered to +91 ${phone10} via Fast2SMS`,
        };
      } else {
        console.warn(`[SMS SERVICE] Fast2SMS error:`, data.message);
        return {
          success: false,
          provider: 'Fast2SMS',
          delivered: false,
          error: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        };
      }
    } catch (err) {
      console.error(`[SMS SERVICE] Fast2SMS network error:`, err.message);
      return { success: false, provider: 'Fast2SMS', delivered: false, error: err.message };
    }
  }

  // 2. Check Twilio (Global SMS)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      console.log(`[SMS SERVICE] Sending via Twilio SMS...`);
      const formattedTo = `+${fullIndianNumber}`;
      const authHeader = Buffer.from(`${twilioSid.trim()}:${twilioAuth.trim()}`).toString('base64');

      const bodyParams = new URLSearchParams();
      bodyParams.append('To', formattedTo);
      bodyParams.append('From', twilioFrom.trim());
      bodyParams.append('Body', smsText);

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid.trim()}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        }
      );

      const data = await res.json();
      console.log(`[SMS SERVICE] Twilio Response:`, data);

      if (res.ok && data.sid) {
        return {
          success: true,
          provider: 'Twilio',
          messageSid: data.sid,
          delivered: true,
          message: `SMS dispatched to +${fullIndianNumber} via Twilio`,
        };
      } else {
        console.warn(`[SMS SERVICE] Twilio error:`, data.message);
        return {
          success: false,
          provider: 'Twilio',
          delivered: false,
          error: data.message,
        };
      }
    } catch (err) {
      console.error(`[SMS SERVICE] Twilio network error:`, err.message);
      return { success: false, provider: 'Twilio', delivered: false, error: err.message };
    }
  }

  // 3. Check 2Factor (India)
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;
  if (twoFactorKey && twoFactorKey.trim()) {
    try {
      console.log(`[SMS SERVICE] Sending via 2Factor.in...`);
      const url = `https://2factor.in/v1/${twoFactorKey.trim()}/SMS/+91${phone10}/${otp}/CivixAI-OTP`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(`[SMS SERVICE] 2Factor Response:`, data);

      if (data.Status === 'Success') {
        return {
          success: true,
          provider: '2Factor',
          delivered: true,
          sessionId: data.Details,
          message: `SMS delivered to +91 ${phone10} via 2Factor`,
        };
      } else {
        return { success: false, provider: '2Factor', delivered: false, error: data.Details };
      }
    } catch (err) {
      return { success: false, provider: '2Factor', delivered: false, error: err.message };
    }
  }

  // 4. No Provider Configured
  console.log(`[SMS SERVICE] ℹ️ Notice: No SMS Gateway API key detected in server/.env (FAST2SMS_API_KEY or TWILIO_ACCOUNT_SID).`);
  console.log(`[SMS SERVICE] Simulating carrier dispatch: OTP ${otp} prepared for +91 ${phone10}.`);

  return {
    success: true,
    provider: 'SimulatedCarrierGateway',
    delivered: false,
    needsApiKey: true,
    message: `Ready for live SMS delivery. Add FAST2SMS_API_KEY or TWILIO_ACCOUNT_SID in server/.env to send real carrier SMS.`,
  };
};

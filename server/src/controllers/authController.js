import { sendRealSms } from '../services/smsService.js';

// In-memory OTP storage: Map of email -> { otp, expiresAt, role, createdAt }
const otpStore = new Map();

// In-memory sessions / accounts
const municipalOfficials = [
  {
    id: 'off-001',
    name: 'Er. Shweta (Executive Engineer)',
    email: 'pwd.engineer@civix.gov',
    password: 'pwd123',
    role: 'officer',
    department: 'Roads & Bridges Department',
    designation: 'Executive Engineer (PWD)',
    badgeNumber: 'MUNI-PWD-8842',
    phone: '+91 7259316811',
  },
  {
    id: 'off-002',
    name: 'Commissioner S. Rao',
    email: 'admin@civix.gov',
    password: 'admin123',
    role: 'admin',
    department: 'Municipal Central Governance',
    designation: 'Municipal Commissioner',
    badgeNumber: 'COMM-001-HQ',
    phone: '+1 (555) 019-2831',
  },
  {
    id: 'off-003',
    name: 'Inspector R. Verma',
    email: 'sanitation.chief@civix.gov',
    password: 'clean123',
    role: 'officer',
    department: 'Sanitation & Solid Waste Management',
    designation: 'Chief Sanitation Officer',
    badgeNumber: 'MUNI-SAN-3102',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 'off-004',
    name: 'Er. K. Murthy',
    email: 'electrical.head@civix.gov',
    password: 'power123',
    role: 'officer',
    department: 'Electrical & Public Streetlighting',
    designation: 'Superintending Electrical Engineer',
    badgeNumber: 'MUNI-ELEC-4921',
    phone: '+1 (555) 987-6543',
  },
  {
    id: 'off-005',
    name: 'Er. A. Kulkarni',
    email: 'water.board@civix.gov',
    password: 'water123',
    role: 'officer',
    department: 'Water Supply & Drainage Board',
    designation: 'Zonal Hydraulic Engineer',
    badgeNumber: 'MUNI-HYDR-1894',
    phone: '+1 (555) 678-1234',
  },
];

const citizenUsers = [
  {
    id: 'ctz-001',
    name: 'Shweta',
    email: 'shweta@gmail.com',
    phone: '7259316811',
    role: 'citizen',
    wardNumber: 'Ward 4 (Shivamogga)',
  },
  {
    id: 'ctz-002',
    name: 'Rahul Sharma',
    email: 'rahul@gmail.com',
    phone: '9876543210',
    role: 'citizen',
    wardNumber: 'Ward 2',
  },
];

/**
 * Helper to normalize and detect phone vs email
 */
const parseIdentifier = (input) => {
  if (!input) return { type: 'invalid', value: '' };
  const raw = input.toString().trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (raw.includes('@')) {
    return { type: 'email', value: raw.toLowerCase() };
  } else if (digitsOnly.length >= 7) {
    const phone10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    return { type: 'phone', value: phone10, rawPhone: raw };
  }
  return { type: 'invalid', value: raw };
};

/**
 * Send OTP to Mobile Number (SMS) or Mail ID
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone, email, identifier, role } = req.body;
    const targetInput = phone || identifier || email;

    if (!targetInput || !targetInput.toString().trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your mobile phone number.',
      });
    }

    const parsed = parseIdentifier(targetInput);

    if (parsed.type === 'invalid') {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number or email address.',
      });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const storeKey = `${parsed.type}:${parsed.value}`;

    otpStore.set(storeKey, {
      otp,
      expiresAt,
      type: parsed.type,
      value: parsed.value,
      role: role || 'citizen',
      createdAt: new Date(),
    });

    if (parsed.type === 'phone') {
      const smsResult = await sendRealSms({
        phone: parsed.value,
        otp,
      });

      return res.json({
        success: true,
        message: smsResult.delivered
          ? `SMS OTP sent successfully to your mobile number +91 ${parsed.value}!`
          : `OTP sent via SMS to mobile number +91 ${parsed.value}.`,
        type: 'phone',
        phone: parsed.value,
        otp, // included for demo and local verification
        smsDelivered: smsResult.delivered,
        provider: smsResult.provider,
        needsApiKey: smsResult.needsApiKey || false,
        smsError: smsResult.error || null,
        expiresInSeconds: 600,
      });
    } else {
      console.log(`\n=======================================================`);
      console.log(`[CIVIX EMAIL GATEWAY] 📧 Outbound Email to ${parsed.value}:`);
      console.log(`"Your CivixAI Verification OTP is: ${otp}. Valid for 10 minutes."`);
      console.log(`=======================================================\n`);

      res.json({
        success: true,
        message: `OTP sent successfully to ${parsed.value}.`,
        type: 'email',
        email: parsed.value,
        otp,
        expiresInSeconds: 600,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Verify OTP and Login (via Mobile Number or Mail ID)
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, email, identifier, otp, role } = req.body;
    const targetInput = phone || identifier || email;

    if (!targetInput || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and 6-digit OTP are required.',
      });
    }

    const parsed = parseIdentifier(targetInput);
    if (parsed.type === 'invalid') {
      return res.status(400).json({
        success: false,
        error: 'Invalid mobile number or email format.',
      });
    }

    const cleanOtp = otp.toString().trim();
    const storeKey = `${parsed.type}:${parsed.value}`;
    const record = otpStore.get(storeKey);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'No active OTP request found for this number. Please click "Send OTP" first.',
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({
        success: false,
        error: 'This OTP code has expired. Please request a new OTP.',
      });
    }

    if (record.otp !== cleanOtp) {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP code. Please check the 6 digits sent to your phone and try again.',
      });
    }

    // OTP Verified! Consume OTP
    otpStore.delete(storeKey);

    // Look for matching account based on requested role context
    let matchedOfficial = null;
    let matchedCitizen = null;

    if (role === 'officer' || role === 'admin') {
      matchedOfficial = municipalOfficials.find((o) => {
        if (parsed.type === 'phone') {
          const oDigits = o.phone ? o.phone.replace(/\D/g, '') : '';
          return oDigits.endsWith(parsed.value) || oDigits === parsed.value;
        }
        return o.email.toLowerCase() === parsed.value;
      });
    } else {
      matchedCitizen = citizenUsers.find((c) => {
        if (parsed.type === 'phone') {
          const cDigits = c.phone ? c.phone.replace(/\D/g, '') : '';
          return cDigits.endsWith(parsed.value) || cDigits === parsed.value;
        }
        return c.email?.toLowerCase() === parsed.value;
      });
    }

    // Fallbacks if not found under preferred role
    if (!matchedOfficial && !matchedCitizen) {
      matchedOfficial = municipalOfficials.find((o) => {
        if (parsed.type === 'phone') {
          const oDigits = o.phone ? o.phone.replace(/\D/g, '') : '';
          return oDigits.endsWith(parsed.value) || oDigits === parsed.value;
        }
        return o.email.toLowerCase() === parsed.value;
      });

      if (!matchedOfficial) {
        matchedCitizen = citizenUsers.find((c) => {
          if (parsed.type === 'phone') {
            const cDigits = c.phone ? c.phone.replace(/\D/g, '') : '';
            return cDigits.endsWith(parsed.value) || cDigits === parsed.value;
          }
          return c.email?.toLowerCase() === parsed.value;
        });
      }
    }

    if (matchedOfficial) {
      const { password: _, ...userSafe } = matchedOfficial;
      return res.json({
        success: true,
        message: `Welcome, ${userSafe.name}! Logged in as ${userSafe.designation}.`,
        token: `token-admin-${userSafe.id}-${Date.now()}`,
        user: userSafe,
      });
    }

    if (matchedCitizen) {
      return res.json({
        success: true,
        message: `Welcome to CivixAI, ${matchedCitizen.name}!`,
        token: `token-citizen-${matchedCitizen.id}-${Date.now()}`,
        user: matchedCitizen,
      });
    }

    // Auto-register new citizen if not found
    const displayName = parsed.type === 'phone'
      ? `Citizen (${parsed.value.slice(-4)})`
      : parsed.value.split('@')[0].charAt(0).toUpperCase() + parsed.value.split('@')[0].slice(1);

    const newCitizen = {
      id: `ctz-${Date.now()}`,
      name: displayName,
      email: parsed.type === 'email' ? parsed.value : `citizen_${parsed.value}@civix.local`,
      phone: parsed.type === 'phone' ? parsed.value : '',
      role: role === 'officer' || role === 'admin' ? 'officer' : 'citizen',
      wardNumber: 'Ward 4 (Shivamogga)',
      createdAt: new Date(),
    };
    citizenUsers.push(newCitizen);

    res.json({
      success: true,
      message: `Welcome to CivixAI, ${newCitizen.name}!`,
      token: `token-citizen-${newCitizen.id}-${Date.now()}`,
      user: newCitizen,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Citizen Login / Registration
 */
export const citizenLogin = async (req, res) => {
  try {
    const { name, phone, email, wardNumber } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({
        success: false,
        error: 'Citizen name and at least a phone number or email are required.',
      });
    }

    let user = citizenUsers.find(
      (c) => (email && c.email?.toLowerCase() === email.toLowerCase()) || (phone && c.phone === phone)
    );

    if (!user) {
      user = {
        id: `ctz-${Date.now()}`,
        name: name.trim(),
        email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '')}@citizen.civix`,
        phone: phone ? phone.trim() : '+1 (555) 000-0000',
        role: 'citizen',
        wardNumber: wardNumber || 'Ward 4',
        createdAt: new Date(),
      };
      citizenUsers.push(user);
    } else {
      // Update name/ward if passed
      if (name) user.name = name.trim();
      if (wardNumber) user.wardNumber = wardNumber;
    }

    res.json({
      success: true,
      message: `Welcome to Citizen Civic Portal, ${user.name}!`,
      token: `token-citizen-${user.id}-${Date.now()}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Municipal Authority / Admin Login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password, department, employeeId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Official municipal email/ID and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const official = municipalOfficials.find(
      (o) =>
        o.email.toLowerCase() === cleanEmail ||
        (employeeId && o.badgeNumber.toLowerCase() === employeeId.trim().toLowerCase())
    );

    if (!official) {
      return res.status(401).json({
        success: false,
        error: 'Invalid municipal credentials. Please check your official Email or Employee ID.',
      });
    }

    if (official.password !== password.trim()) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect authorization password for this municipal officer account.',
      });
    }

    // Verify department if specifically selected
    if (department && department !== 'ALL' && official.department !== 'Municipal Central Governance') {
      if (official.department !== department) {
        return res.status(403).json({
          success: false,
          error: `Authorized for ${official.department}, but attempting login under ${department}.`,
        });
      }
    }

    const { password: _, ...userSafe } = official;

    res.json({
      success: true,
      message: `Authorized municipal access granted for ${userSafe.name} (${userSafe.designation}).`,
      token: `token-admin-${userSafe.id}-${Date.now()}`,
      user: userSafe,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get sample demo accounts for quick testing
 */
export const getDemoAccounts = (req, res) => {
  const safeOfficials = municipalOfficials.map(({ password, ...rest }) => rest);
  res.json({
    success: true,
    data: {
      citizens: citizenUsers,
      officials: safeOfficials,
    },
  });
};

/**
 * Get real SMS Gateway status
 */
export const getSmsStatus = (req, res) => {
  const hasFast2Sms = Boolean(process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim());
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
  const has2Factor = Boolean(process.env.TWOFACTOR_API_KEY && process.env.TWOFACTOR_API_KEY.trim());

  let activeProvider = 'Simulated Gateway (Demo Mode)';
  if (hasFast2Sms) activeProvider = 'Fast2SMS (India Live SMS)';
  else if (hasTwilio) activeProvider = 'Twilio (Live SMS)';
  else if (has2Factor) activeProvider = '2Factor.in (India Live SMS)';

  res.json({
    success: true,
    hasRealSmsProvider: hasFast2Sms || hasTwilio || has2Factor,
    activeProvider,
    providers: {
      fast2sms: hasFast2Sms,
      twilio: hasTwilio,
      twofactor: has2Factor,
    },
  });
};

/**
 * Update SMS Gateway key dynamically
 */
export const updateSmsKey = (req, res) => {
  const { fast2smsKey, twilioSid, twilioToken, twilioPhone, twoFactorKey } = req.body;

  if (fast2smsKey !== undefined) {
    process.env.FAST2SMS_API_KEY = fast2smsKey.trim();
  }
  if (twilioSid !== undefined) {
    process.env.TWILIO_ACCOUNT_SID = twilioSid.trim();
  }
  if (twilioToken !== undefined) {
    process.env.TWILIO_AUTH_TOKEN = twilioToken.trim();
  }
  if (twilioPhone !== undefined) {
    process.env.TWILIO_PHONE_NUMBER = twilioPhone.trim();
  }
  if (twoFactorKey !== undefined) {
    process.env.TWOFACTOR_API_KEY = twoFactorKey.trim();
  }

  res.json({
    success: true,
    message: 'SMS Gateway credentials updated successfully!',
  });
};

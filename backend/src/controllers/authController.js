
// backend/src/controllers/authController.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getAdminUserId } from '../utils/helpers.js';
import {
  sendSellerRegistrationEmail,
  sendAdminNewSellerNotification,
  sendOTPEmail, // New: Added for OTP functionality
} from '../services/emailService.js';
import crypto from 'crypto'; // New: Added for generating OTP

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      usageType,
      location,
      businessDetails,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Validate role
    const validRoles = ['customer', 'retailer', 'supplier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // For retailers/suppliers, require business details
    if ((role === 'retailer' || role === 'supplier') && !businessDetails?.businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business details are required for retailers and suppliers',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role,
      phone,
      usageType,
      location,
      businessDetails: (role === 'retailer' || role === 'supplier') ? businessDetails : undefined,
      preferences: {
        language: req.body.language || 'en',
      },
    });

    // ✅ Send emails for retailers/suppliers
    if (role === 'retailer' || role === 'supplier') {
      try {
        // Send registration email to seller
        await sendSellerRegistrationEmail(email, name, role);
        console.log(`✅ Registration email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send registration email:', emailError);
        // Don't fail registration if email fails
      }

      try {
        // Notify admin
        await sendAdminNewSellerNotification(name, email, role);
        console.log('✅ Admin notification email sent');
      } catch (emailError) {
        console.error('❌ Failed to send admin notification:', emailError);
      }

      // Create in-app notification for admin
      try {
        const adminId = await getAdminUserId();
        await Notification.create({
          user: adminId,
          type: 'user_approval_needed',
          title: 'New Seller Registration',
          message: `${name} registered as ${role} and needs approval`,
          priority: 'high',
        });
      } catch (notifError) {
        console.error('❌ Failed to create notification:', notifError);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: role === 'customer' 
        ? 'Registration successful!' 
        : 'Registration successful! Check your email for further instructions.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    // Check if seller is approved
    if ((user.role === 'retailer' || user.role === 'supplier') && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. You will be notified once approved.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        usageType: user.usageType,
        businessDetails: user.businessDetails,
        preferences: user.preferences,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user (client-side token deletion)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // Update last active
    req.user.lastActive = new Date();
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user language preference
 * @route   PUT /api/auth/language
 * @access  Private
 */
export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    const validLanguages = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Must be one of: ${validLanguages.join(', ')}`,
      });
    }

    req.user.preferences.language = language;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Language updated successfully',
      data: {
        language: req.user.preferences.language,
      },
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating language',
      error: error.message,
    });
  }
};

/**
 * @desc    Google OAuth Callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Generate token
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&user=${JSON.stringify({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved
    })}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * @desc    Forgot Password - Request OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
      });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Error sending OTP email',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    const user = await User.findOne({ 
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // OTP is valid
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    const user = await User.findOne({ 
      email,
      resetOTP: otp,
      resetOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Update password and clear OTP fields
    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

export default {
  register,
  login,
  getMe,
  logout,
  updateLanguage,
  googleCallback,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
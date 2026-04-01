// backend/src/config/passportConfig.js
import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: process.env.NODE_ENV === 'production',
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('🌐 Google OAuth Attempt:', profile?.emails?.[0]?.value || 'no email');
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;

        // Check if user exists with googleId
        let user = await User.findOne({ googleId: id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with email (link accounts)
        user = await User.findOne({ email });

        if (user) {
          user.googleId = id;
          // If no profile image, use Google one
          if (!user.profileImage?.url && photos && photos.length > 0) {
            user.profileImage = { url: photos[0].value };
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: displayName,
          email,
          googleId: id,
          role: 'customer', // Default role for Google signups
          isVerified: true,
          profileImage: photos && photos.length > 0 ? { url: photos[0].value } : undefined,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize/Deserialize user (required for sessions, though we use JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

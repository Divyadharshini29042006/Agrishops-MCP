import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const findCustomer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const customer = await User.findOne({ role: 'customer' });
    if (customer) {
      console.log('Customer Found:');
      console.log('Email:', customer.email);
    } else {
      console.log('No customer found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findCustomer();

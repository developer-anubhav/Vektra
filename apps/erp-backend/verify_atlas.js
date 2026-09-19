import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Company from './src/models/Company.js';
import User from './src/models/userModel.js';
import Employee from './src/models/Employee.js';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas for verification.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in DB:', collections.map(c => c.name));

        const companies = await Company.find({}).select('name email employees');
        console.log('Companies and embedded employees:');
        console.log(JSON.stringify(companies, null, 2));

        const users = await User.find({}).select('name email role companyId');
        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));

        const standaloneEmployees = await Employee.find({});
        console.log('Documents in standalone employees collection:');
        console.log(JSON.stringify(standaloneEmployees, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error verifying data:', error);
        process.exit(1);
    }
};

verify();

import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'admin';

    const existingAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!existingAdmin) {
      await User.create({
        username: superAdminUsername,
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      // console.log('Super Admin created successfully!');
      // console.log(`Email: ${superAdminEmail}`);
      // console.log(`Password: ${superAdminPassword}`);
    } else {
      console.log('Super Admin already exists');
    }
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
};

export default seedSuperAdmin;
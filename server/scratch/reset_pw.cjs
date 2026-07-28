const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb+srv://SaaS-Admin:bwCnUiH4pOKGExsi@aiproductivesaas.imd9zo8.mongodb.net/')
  .then(async () => {
    const db = mongoose.connection.db;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await db.collection('users').updateMany({}, { $set: { password: hashedPassword } });
    console.log('Password reset successfully for all test users.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

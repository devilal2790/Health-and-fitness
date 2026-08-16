const mongoose = require('mongoose');

// Define exactly what fields a User document should have
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true // The database will reject the save if 'name' is missing
  },
  username: { 
    type: String, 
    required: true,
    unique: true // Ensures no two users have the same username
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: {
    type: String,
    required: true
  },
  age: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' dates

// Export the model so we can use it in our server.js file
module.exports = mongoose.model('User', userSchema);
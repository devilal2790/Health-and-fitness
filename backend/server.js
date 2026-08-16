// 1. Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User'); 

// 2. Initialize the Express app
const app = express();
const PORT = 3000;

// 3. Configure Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Tell Express to automatically parse JSON data sent from the frontend

// 4. Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/user_details')
  .then(() => console.log('✅ Connected to local MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 5. Create the API Route (The "Endpoint")
// This listens for POST requests sent to http://localhost:3000/api/users
app.post('/api/users', async (req, res) => {
  try {
    // Extract data from the incoming request body
    const { name, username, email, password, age } = req.body;

    // Create a new database entry using the Mongoose model
    const newUser = new User({
      name: name,
      username: username,
      email: email,
      password: password,
      age: age
    });

    // Save the entry to the database
    await newUser.save();

    // Send a success response back to the frontend
    res.status(201).json({ message: 'User successfully saved to the database!' });

  } catch (error) {
    // If saving fails (e.g., duplicate email), catch the error and send it back
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user data.' });
  }
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});
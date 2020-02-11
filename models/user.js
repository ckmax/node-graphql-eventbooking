/**
 * User Model
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdEvents: [
    {
      type: Schema.Types.ObjectId, // Uses object ID in MongoDB
      ref: 'Event', // Shows relation with Event model
    },
  ],
});

module.exports = mongoose.model('User', userSchema);

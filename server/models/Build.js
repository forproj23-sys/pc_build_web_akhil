const mongoose = require('mongoose');

const BuildSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    components: [
      {
        componentID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Component',
          required: true,
        },
        componentName: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    assemblyStatus: {
      type: String,
      enum: ['Pending', 'Assembling', 'Completed'],
      default: 'Pending',
    },
    assemblerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    compatibilityCheck: {
      type: Object,
      default: {},
    },
    isCompatible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Build', BuildSchema);

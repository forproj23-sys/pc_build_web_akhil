const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    specifications: {
      type: String,
      required: true,
    },
    compatibility: {
      type: String,
      default: '',
    },
    // Structured compatibility fields
    socket: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    chipset: {
      type: String,
      default: '',
      trim: true,
    },
    formFactor: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    powerRequirement: {
      type: Number,
      default: 0,
      min: 0,
    },
    ramType: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    storageInterface: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    wattage: {
      type: Number,
      default: 0,
      min: 0,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    stockStatus: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
    },
    supplierID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Component', ComponentSchema);

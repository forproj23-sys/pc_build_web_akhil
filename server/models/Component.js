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
      enum: ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'],
      required: true,
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
    url: {
      type: String,
      default: '',
      trim: true,
    },
    stockStatus: {
      type: Boolean,
      default: true,
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

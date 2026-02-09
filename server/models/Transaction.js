const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['payment', 'payout', 'refund'],
      required: true,
    },
    buildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Build',
    },
    from: {
      type: String, // 'user'|'admin'|'assembler'
      required: true,
    },
    to: {
      type: String, // 'admin'|'assembler'|'user'
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    meta: {
      type: Object,
      default: {},
    },
    txId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);


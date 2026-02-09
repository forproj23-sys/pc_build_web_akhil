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
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'settled', 'refunded', 'partial_refund'],
        default: 'pending',
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      paymentRecords: [
        {
          paymentId: String,
          provider: String,
          amount: Number,
          status: String,
          method: String,
          meta: Object,
          createdAt: Date,
        },
      ],
      escrowReleased: {
        type: Boolean,
        default: false,
      },
    },
    assemblerPayout: {
      amount: {
        type: Number,
        default: 0,
      },
      paid: {
        type: Boolean,
        default: false,
      },
      paidAt: {
        type: Date,
      },
      transactionId: {
        type: String,
      },
      // Final payout (remaining amount) fields
      finalPaid: {
        type: Boolean,
        default: false,
      },
      finalPaidAt: {
        type: Date,
      },
      finalTransactionId: {
        type: String,
      },
    },
    refundRequests: [
      {
        amount: Number,
        reason: String,
        status: {
          type: String,
          enum: ['requested', 'approved', 'rejected', 'processed'],
          default: 'requested',
        },
        createdAt: Date,
        processedBy: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Build', BuildSchema);

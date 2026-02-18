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
      // New payment distribution structure
      adminCommission: {
        type: Number,
        default: 0, // 3% of total
      },
      assemblerCommission: {
        type: Number,
        default: 0, // 7% of total
      },
      assemblerCommissionPaid: {
        type: Boolean,
        default: false,
      },
      assemblerCommissionPaidAt: {
        type: Date,
      },
      assemblerCommissionTxId: {
        type: String,
      },
      escrowAmount: {
        type: Number,
        default: 0, // 90% of total, held until completion
      },
      escrowDistributed: {
        type: Boolean,
        default: false, // True when suppliers have been paid
      },
    },
    supplierPayouts: [
      {
        supplierID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        componentID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Component',
        },
        componentName: String,
        paid: {
          type: Boolean,
          default: false,
        },
        paidAt: Date,
        transactionId: String,
      },
    ],
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

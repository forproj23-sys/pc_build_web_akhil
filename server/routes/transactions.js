const express = require('express');
const Build = require('../models/Build');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions
// - Admin: returns all transactions
// - User: returns transactions for builds owned by the user
// - Assembler: returns transactions for builds assigned to the assembler
router.get('/', protect, async (req, res) => {
  try {
    const role = req.user.role;

    let txQuery = {};

    if (role === 'admin') {
      // no extra filter
    } else if (role === 'user') {
      const builds = await Build.find({ userID: req.user._id }).select('_id');
      const ids = builds.map((b) => b._id);
      txQuery.buildId = { $in: ids };
    } else if (role === 'assembler') {
      const builds = await Build.find({ assemblerID: req.user._id }).select('_id');
      const ids = builds.map((b) => b._id);
      txQuery.buildId = { $in: ids };
    } else {
      // other roles (supplier etc) - return empty set by default
      return res.json({ success: true, count: 0, data: [] });
    }

    const transactions = await Transaction.find(txQuery).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


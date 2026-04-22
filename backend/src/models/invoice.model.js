const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
    default: "0",
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  items: {
    type: [invoiceItemSchema],
    required: true,
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: "Invoice must include at least one item",
    },
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  paid: {
    type: Number,
    required: true,
    min: 0,
  },
  remaining: {
    type: Number,
    required: true,
    min: 0,
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);

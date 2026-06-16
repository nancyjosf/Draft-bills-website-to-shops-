const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
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
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      enum: ["منظفات", "ورقيات", "مستحضرات تجميل"],
      default: "منظفات",
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 1 });

module.exports = mongoose.model("Product", productSchema);

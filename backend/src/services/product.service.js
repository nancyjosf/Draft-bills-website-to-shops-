const Product = require("../models/product.model");

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const toFlexibleArabicPattern = (value = "") => {
  const map = {
    ا: "[اأإآ]",
    أ: "[اأإآ]",
    إ: "[اأإآ]",
    آ: "[اأإآ]",
    ي: "[يىئ]",
    ى: "[يىئ]",
    ئ: "[يىئ]",
    ة: "[هة]",
    ه: "[هة]",
    و: "[وؤ]",
    ؤ: "[وؤ]",
  };

  return [...value.trim()]
    .map((char) => map[char] || escapeRegex(char))
    .join("");
};

const listProducts = async (search = "", category = "") => {
  const term = search.trim();
  const filter = {};

  if (term) {
    filter.name = { $regex: toFlexibleArabicPattern(term), $options: "i" };
  }

  if (category && category.trim()) {
    filter.category = category.trim();
  }

  return Product.find(filter).sort({ createdAt: -1 }).lean();
};

const findProductById = async (id) => {
  return Product.findById(id).lean();
};

const createProduct = async (payload) => {
  return Product.create(payload);
};

const updateProduct = async (id, payload) => {
  return Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteProduct = async (id) => {
  return Product.findByIdAndDelete(id);
};

const findProductsByIds = async (ids = []) => {
  return Product.find({ _id: { $in: ids } }).lean();
};

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductsByIds,
};

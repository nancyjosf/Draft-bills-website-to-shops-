const productService = require("../services/product.service");

const VALID_CATEGORIES = ["منظفات", "ورقيات", "مستحضرات تجميل"];

const validateProductPayload = (payload = {}) => {
  const { name, price, category } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    return "Product name is required";
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return "Price must be a number greater than or equal to 0";
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    return `Category must be one of: ${VALID_CATEGORIES.join(", ")}`;
  }

  return null;
};

const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const products = await productService.listProducts(
      search || "",
      category || "",
    );
    return res.json(products);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Invalid product id", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const validationError = validateProductPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, price, category } = req.body;
    const product = await productService.createProduct({
      name: name.trim(),
      price: Number(price),
      category: category || "منظفات",
    });
    return res.status(201).json(product);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to create product", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const validationError = validateProductPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, price, category } = req.body;
    const product = await productService.updateProduct(req.params.id, {
      name: name.trim(),
      price: Number(price),
      category: category || "منظفات",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to update product", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Failed to delete product", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

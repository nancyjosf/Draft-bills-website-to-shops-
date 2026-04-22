const productService = require("../services/product.service");

const validateProductPayload = (payload = {}) => {
  const { name, price } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    return "Product name is required";
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return "Price must be a number greater than or equal to 0";
  }

  return null;
};

const getProducts = async (req, res) => {
  try {
    const products = await productService.listProducts(req.query.search || "");
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

    const { name, price } = req.body;
    const product = await productService.createProduct({
      name: name.trim(),
      price: Number(price),
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

    const { name, price } = req.body;
    const product = await productService.updateProduct(req.params.id, {
      name: name.trim(),
      price: Number(price),
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

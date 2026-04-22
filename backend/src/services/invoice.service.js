const normalizeItems = (items = []) => {
  return items
    .map((item) => ({
      productId: item.productId || "",
      quantity: Number(item.quantity || 0),
    }))
    .filter((item) => item.productId && item.quantity > 0);
};

const calculateTotal = (items = []) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const buildInvoiceItemsFromProducts = (products = [], requestedItems = []) => {
  const productMap = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const validatedItems = [];

  for (const requestItem of requestedItems) {
    const product = productMap.get(requestItem.productId);
    if (!product) {
      continue;
    }

    validatedItems.push({
      name: product.name,
      price: product.price,
      quantity: Math.floor(requestItem.quantity),
    });
  }

  return validatedItems.filter((item) => item.quantity > 0);
};

const computePayment = (total, paidAmount) => {
  const paid = Number(paidAmount || 0);
  const remaining = Math.max(total - paid, 0);

  return {
    paid,
    remaining,
  };
};

module.exports = {
  normalizeItems,
  calculateTotal,
  buildInvoiceItemsFromProducts,
  computePayment,
};

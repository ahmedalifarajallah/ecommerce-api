// utils/skuGenerator.js
const crypto = require("crypto");

exports.generateSKU = function ({ title, color, size, productId }) {
  // Normalize title (use first 3–4 letters)
  const T = title ? title.substring(0, 4).toUpperCase() : "PROD";

  // Color code (or N/A)
  const C = color ? color.substring(0, 3).toUpperCase() : "NON";

  // Size code
  const S = size ? size.toUpperCase() : "NOS"; // NO SIZE

  // Short hash from product ID to prevent duplicates
  const shortId =
    productId && typeof productId === "string"
      ? productId.slice(-4).toUpperCase()
      : crypto.randomBytes(2).toString("hex").toUpperCase();

  // Final SKU Format:
  // TTTT-COL-SIZE-XXXX
  return `${T}-${C}-${S}-${shortId}`;
};

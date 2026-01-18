// Generate product code
function generateProductCode(title) {
  return title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 4)
    .toUpperCase();
}

// Generate attributes code
function generateAttributesCode(attributes) {
  return Object.values(attributes)
    .map((val) => val.substring(0, 3).toUpperCase())
    .join("-");
}

// Generate SKU
exports.generateSKU = ({ title, attributes, index }) => {
  const productCode = generateProductCode(title);
  const attrCode = generateAttributesCode(attributes);
  const sequence = String(index + 1).padStart(3, "0");

  return `${productCode}-${attrCode}-${sequence}`;
};

// Generate Barcode
exports.generateBarcode = () => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(100 + Math.random() * 900);
  return `${timestamp}${random}`; // 13 digits
};

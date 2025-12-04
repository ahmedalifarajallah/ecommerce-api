const { default: mongoose } = require("mongoose");

exports.seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    keywords: [{ type: String }],
  },
  { _id: false }
);

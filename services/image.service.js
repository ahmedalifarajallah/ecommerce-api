const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const logger = require("../utils/logger");
const { CONSTANTS } = require("../utils/constants");

class ImageService {
  constructor(folderPath) {
    this.uploadPath = folderPath;
    this.uploadedImages = [];
  }

  async ensureDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  generateFilename(prefix = "image") {
    const random = crypto.randomBytes(8).toString("hex");
    return `${prefix}-${Date.now()}-${random}.jpeg`;
  }

  async processImage({ buffer, type }) {
    if (!type) throw new Error("Image type is required");

    const normalizedType = type.toUpperCase();
    const config = CONSTANTS.IMAGE_RESIZE[normalizedType];

    if (!config) {
      throw new Error(`Invalid image type: ${type}`);
    }

    const filename = this.generateFilename(normalizedType.toLowerCase());
    const filepath = path.join(this.uploadPath, filename);

    await sharp(buffer)
      .resize(config.width, config.height)
      .jpeg({ quality: config.quality })
      .toFile(filepath);

    this.uploadedImages.push(filename);
    return filename;
  }

  async deleteImages(paths) {
    if (!paths || paths.length === 0) return;

    await Promise.all(
      paths.map(async (filePath) => {
        try {
          const filename = path.basename(filePath); // extract filename from full path
          await fs.unlink(path.join(this.uploadPath, filename));
          logger.info(`Deleted image: ${filename}`);
        } catch (error) {
          logger.warn(`Failed to delete image ${filePath}: ${error.message}`);
        }
      }),
    );
  }

  commit() {
    this.uploadedImages = [];
  }
  async rollback() {
    if (this.uploadedImages.length > 0) {
      logger.info("Rolling back uploaded images...");
      await this.deleteImages(this.uploadedImages);
      this.uploadedImages = [];
    }
  }
}

module.exports = ImageService;

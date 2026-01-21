const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");

/**
 * Delete multiple files from a specific folder
 * @param {string} folderPath - Absolute or relative folder path
 * @param {...string} fileNames - File names to be deleted
 */
exports.deleteFiles = async (folderPath, ...fileNames) => {
  try {
    await fs.access(folderPath);
  } catch {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        await fs.unlink(path.join(folderPath, fileName));
      } catch {}
    }),
  );
};

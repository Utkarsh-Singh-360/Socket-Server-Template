const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;

/**
 * Writes data to a JSON file.
 * @param {string} fileName - The name of the JSON file.
 * @param {Object} data - The data to write to the file.
 * @param {function} callback - A callback function to handle completion.
 */
function writeJsonToFile(fileName, data, callback) {
  const filePath = path.join(__dirname, '..' , fileName);
  const jsonData = JSON.stringify(data, null, 2); // Pretty print with 2 spaces for readability

  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to file ${fileName}:`, err);
      if (callback) callback(err);
      return;
    }
    console.log(`File ${fileName} has been saved.`);
    if (callback) callback(null);
  });
}

async function deleteFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
    console.log('File deleted successfully');
  } catch (err) {
    console.error(`Error deleting file: ${err}`);
  }
}


function fileExistsSync(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (err) {
      // Handle potential errors (e.g., invalid path)
      return false;
    }
}
   

module.exports = {writeJsonToFile,fileExistsSync,deleteFile}



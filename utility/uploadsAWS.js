const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Configure AWS credentials (replace with your actual credentials)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION_NAME, // Update with your S3 bucket region
});

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION_NAME,AWS_BUCKET_NAME } = process.env
console.log(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION_NAME,AWS_BUCKET_NAME)

const s3 = new AWS.S3();

/**
 * Uploads a file to the specified S3 bucket
 * @param {string} fileName Path to the file to upload
 */
async function uploadFile(fileName) {
  try {
    const fileStream = fs.createReadStream(fileName);

    // Handle errors from the stream
    fileStream.on("error", (err) => {
      console.log("File Error While Create Streams", err);
    });

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: path.basename(fileName), // Or a unique filename can be generated here
      Body: fileStream,
    };

    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. Location: ${data.Location}`);
  } catch (err) {
    console.error("Error uploading file:", err);
  }
}

module.exports = { uploadFile };

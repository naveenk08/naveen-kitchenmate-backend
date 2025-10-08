const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const axios = require("axios");
const config = require("../config/s3");

const s3 = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

const BUCKET_NAME = config.bucketName;

/**
 * Uploads a file from a form-data request to S3.
 * @param {Object} file - The uploaded file (Multer object).
 * @returns {string} S3 URL of the uploaded file.
 */
exports.uploadToS3 = async (file, kitchenid, name, id) => {
  const strName = name.replace(/ /g, "-");
  let key=''
  if(id == 'expense'){
     key = `uploads/expense/${name}/Expense_${kitchenid}`;
  }
  else 
   key = `uploads/${kitchenid}/${id}_${strName}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${BUCKET_NAME}.s3.${config.region}.amazonaws.com/${key}`;
};

/**
 * Downloads an image from a URL and uploads it to S3.
 * @param {string} imageUrl - The image URL.
 * @returns {string} S3 URL of the uploaded image.
//  */
// exports.uploadToS3FromUrl = async (imageUrl, name) => {
//   try {
//     const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
//     const buffer = Buffer.from(response.data, "binary");

//     const key = `uploads/${Date.now()}_${name}.jpg`;

//     const uploadParams = {
//       Bucket: BUCKET_NAME,
//       Key: key,
//       Body: buffer,
//       ContentType: "image/jpeg",
//     };

//     await s3.send(new PutObjectCommand(uploadParams));
//     return `https://${BUCKET_NAME}.s3.${config.region}.amazonaws.com/${key}`;
//   } catch (error) {
//     console.error("Error fetching image from URL:", error);
//     throw new Error("Failed to upload image from URL");
//   }
// };

/**
 * Extracts the object key from the S3 URL.
 * @param {string} url - The S3 URL.
 * @returns {string} Extracted key.
 */
const extractKeyFromUrl = (url) => {
  const urlObj = new URL(url);
  return urlObj.pathname.substring(1); // Removes the leading "/"
};

/**
 * Deletes a file from S3 given its URL.
 * @param {string} url - The S3 file URL.
 * @returns {boolean} Returns true if successful.
 */
exports.deleteFromS3 = async (url) => {
  try {
    const key = extractKeyFromUrl(url);

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    ("✅ File deleted successfully from S3");
    return true;
  } catch (error) {
    console.error("❌ Error deleting file from S3:", error);
    return false;
  }
};

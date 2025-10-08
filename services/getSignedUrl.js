const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.AWS_REGION, // e.g., "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateSignedUrl = async (fileKey) => {

  if (!fileKey) return null; // Handle missing images gracefully
  const urlParts = new URL(fileKey);
  const fileName = decodeURIComponent(urlParts.pathname.substring(1));
  


  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800   }); 


    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
};

module.exports = generateSignedUrl;

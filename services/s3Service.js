const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");


const s3 = new S3Client({
    region: process.env.AWS_REGION
});

const getDownloadUrl = async (key, expires = 300) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3, command, {
        expiresIn: expires,
    });
};

const uploadFile = async (buffer, key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return key;
};

module.exports = {
    getDownloadUrl,
    uploadFile,
};
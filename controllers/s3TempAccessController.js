require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate Pre-Signed URL
exports.s3TempKey = async (req, res) => {
  try {
    const { s3Url } = req.query; 
       

    if (!s3Url) {
      return res.status(400).json({ error: "S3 URL is required" });
    }

    // Extract bucket name and file key from S3 URL
    const urlParts = new URL(s3Url);
    const bucketName = process.env.AWS_BUCKET_NAME; // Use environment variable for bucket
    const fileKey = decodeURIComponent(urlParts.pathname.substring(1)); // Remove leading "/"

    if (!fileKey) {
      return res.status(400).json({ error: "Invalid S3 URL format" });
    }

    ("Extracted File Key:", fileKey);

    const params = {
      Bucket: bucketName,
      Key: fileKey,
    };

    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 20 });

    res.json({ signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
};
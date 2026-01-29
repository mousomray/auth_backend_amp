const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const s3 = new S3Client({
  region: process.env.YOUR_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY,
    secretAccessKey: process.env.YOUR_SECRET_KEY,
  },
});

const uploadSingleImage = async (file) => {
  if (!file) return null;

  const key = `institutions/${Date.now()}-${file.originalname}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.BUCKETNAME,
      Key: key,
      Body: file.buffer,      
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  return `https://${process.env.BUCKETNAME}.s3.${process.env.YOUR_BUCKET_REGION}.amazonaws.com/${key}`;
};

module.exports = uploadSingleImage;

const aws = require("aws-sdk");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_NAME) {
  console.error('Missing required AWS environment variables.');
  process.exit(1);
}
console.log('env', process.env.AWS_ACCESS_KEY_ID)
console.log('env', process.env.AWS_BUCKET_NAME)
console.log('env', process.env.AWS_SECRET_ACCESS_KEY)

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-central-1'
});
console.log('aws config', aws.config)
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const bucketName = process.env.AWS_BUCKET_NAME;

const handleUpload = async (req, res) => {
  try {
    // Прочитайте файл изображения
    const fileContent = fs.readFileSync(req.file.path);

    // Определите параметры загрузки
    const params = {
      Bucket: bucketName,
      Key: 'uploaded-image.jpg', // Имя файла в бакете
      Body: fileContent,
      ContentType: 'image/jpeg', // Укажите правильный тип контента
      ACL: 'public-read', // Установите разрешения на чтение для всех
    };

    // Выполните загрузку в S3
    const result = await s3.upload(params).promise();

    // Удалите временный файл после загрузки
    fs.unlinkSync(req.file.path);

    // Верните URL загруженного изображения в ответе
    res.status(200).json({ success: true, imageUrl: result.Location });
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { handleUpload };

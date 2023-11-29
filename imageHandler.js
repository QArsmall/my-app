require('dotenv').config(); // Загрузка переменных окружения из файла .env

const aws = require('aws-sdk');
const fs = require('fs');

// Конфигурируем S3
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();
const bucketName = AWS_BUCKET_NAME;

const handleUpload = async (req, res) => {
  try {
    // Прочитайте файл изображения
    const fileContent = fs.readFileSync('./public/111.jpg');

    // Определите параметры загрузки
    const params = {
      Bucket: bucketName,
      Key: '111.jpg', // Имя файла в бакете
      Body: fileContent,
      ContentType: 'image/jpeg', // Укажите правильный тип контента
      ACL: 'public-read', // Установите разрешения на чтение для всех
    };

    // Выполните загрузку в S3
    const result = await s3.upload(params).promise();

    // Верните URL загруженного изображения в ответе
    res.status(200).json({ success: true, imageUrl: result.Location });
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { handleUpload };

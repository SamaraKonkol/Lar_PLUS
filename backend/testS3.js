require("dotenv").config();

const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("./src/config/s3");

async function testarS3() {
    try {
        const comando = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "teste-lar-plus.txt",
            Body: "Olá AWS! O Lar+ conseguiu acessar o S3!"
        });

        await s3.send(comando);

        console.log("✅ LAR+ CONECTADO AO S3!!!");
    } catch (erro) {
        console.error("❌ Erro ao acessar o S3:");
        console.error(erro);
    }
}

testarS3();
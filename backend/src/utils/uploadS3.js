const { PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

const s3 = require("../config/s3");

async function uploadImagemS3(arquivo, pasta = "imoveis") {
    const extensao = arquivo.originalname
        .split(".")
        .pop()
        .toLowerCase();

    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;

    const key = `${pasta}/${nomeArquivo}`;

    const comando = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: arquivo.buffer,
        ContentType: arquivo.mimetype
    });

    await s3.send(comando);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return url;
}

module.exports = {
    uploadImagemS3
};
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        files: 10,
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Formato inválido. Envie imagens JPG, PNG ou WEBP."
                )
            );
        }

        cb(null, true);
    }
});

module.exports = upload;
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        files: 13,
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const imagensPermitidas = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        const documentosPermitidos = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        if (file.fieldname === "fotos") {
            if (!imagensPermitidas.includes(file.mimetype)) {
                return cb(new Error("Formato inválido para foto."));
            }

            return cb(null, true);
        }

        if (
            file.fieldname === "matricula" ||
            file.fieldname === "comprovante_propriedade" ||
            file.fieldname === "iptu_documento"
        ) {
            if (!documentosPermitidos.includes(file.mimetype)) {
                return cb(new Error("Formato inválido para documento."));
            }

            return cb(null, true);
        }

        cb(new Error("Campo de arquivo inválido."));
    }
});

module.exports = upload;
import multer from "multer";
import path from "path";
import { getUploadPaths } from "../services/storage-service.js";
import { HttpError } from "../utils/http-error.js";

const { supportAttachmentDir } = getUploadPaths();

function makeStorage(destination) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

function makeFileFilter(allowedMimeTypes) {
  return (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new HttpError(400, "Unsupported file type."));
      return;
    }
    cb(null, true);
  };
}

export const uploadSupportAttachment = multer({
  storage: makeStorage(supportAttachmentDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: makeFileFilter(["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"]),
});

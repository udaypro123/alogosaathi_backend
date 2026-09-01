import { Router } from 'express';
import { upload, uploadFile, uploadToCloudinary, deleteFile } from '../utils/fileUpload.js';
import { authorize, protect } from '../middleware/auth.js';
import {User} from '../models/User.models.js';

const router = Router();

router.post(
    "/upload",
    protect,
    upload.single("file"),
    async (req, res) => {
        try {
            console.log("User:", req.user);
            console.log("File:", req.file);

            if (!req.file) {
                return res.status(400).json({
                    error: "No file uploaded"
                });
            }

            const tmpPath = await uploadFile(req.file);

            if (!tmpPath) {
                return res.status(400).json({
                    error: "Unable to create temporary file"
                });
            }

            const result = await uploadToCloudinary(
                tmpPath,
                "my-app"
            );

            await deleteFile(tmpPath);

            const user = await User.findById(
                req.user._id
            );

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }


            console.log("result",result)

            user.profilePicture = result.url;
            user.profileImagePublicId = result.public_id;

            await user.save();

            return res.status(200).json({
                message: "Profile image uploaded successfully",
                url: result.secure_url,
                public_id: result.public_id
            });

        } catch (e) {
            console.error(
                "Profile image upload error:",
                e
            );

            return res.status(500).json({
                error: e.message
            });
        }
    }
);
export default router;

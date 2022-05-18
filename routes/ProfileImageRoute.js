const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const db = require("./database");

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images/");
    },
    filename: (req, file, cb) => {
      cb(null, new Date().valueOf() + "_" + file.originalname);
    },
  }),
});

// upload profile image
router.post("/image_upload", imageUpload.single("image"), async (req, res) => {
  const { user_id } = req.body;
  const { filename, path: filepath, mimetype, size } = req.file;

  try {
    await db
      .insert({
        filename,
        filepath,
        mimetype,
        size,
        user_id,
      })
      .into("profile_image_files");

    res.status(200).json({
      success: true,
      filename,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Image upload failed",
      error: error.stack,
    });
  }
});

// get specific user profile image
router.get("/image/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const profileImage = await db
      .select("*")
      .from("profile_image_files")
      .where({ user_id: userId });

    if (profileImage[0]) {
      const dirname = path.resolve();
      const fullfilepath = path.join(dirname, profileImage[0].filepath);
      return res.status(200).json({
        imageUri: fullfilepath,
      });
    } else return res.json(null);
  } catch (error) {
    res.json({
      success: false,
      message: "error occured",
      error: error.stack,
    });
  }
});

// delete specific user image
router.delete("/image_delete/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await db.del().from("profile_image_files").where({ user_id: userId });

    res.status(200).json({ message: "profile image deleted." });
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;

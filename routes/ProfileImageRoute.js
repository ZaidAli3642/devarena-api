const router = require("express").Router();
const db = require("./database");

// upload profile image
router.post("/image_upload", async (req, res) => {
  const { user_id, filename, filepath, mimetype, size, profile_imageurl } =
    req.body;
  console.log(req.body);

  try {
    await db
      .insert({
        profile_filename: filename,
        profile_filepath: filepath,
        profile_mimetype: mimetype,
        profile_size: size,
        profile_imageurl,
        user_id,
      })
      .into("profile_image_files");

    res.status(200).json({
      success: true,
      profile_imageurl,
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
      // const fullfilepath = path.join(__dirname, profileImage[0].filepath);
      return res.status(200).json({
        imageUri: profileImage[0].profile_imageurl,
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: "error occured",
      error: error.stack,
    });
  }
});

// delete specific user
router.delete("/image_delete/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user_image = await db
      .del()
      .from("profile_image_files")
      .where({ user_id: userId })
      .returning("*");

    res.status(200).json({ message: "profile image deleted.", user_image });
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;

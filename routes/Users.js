const router = require("express").Router();
const db = require("./database");
const path = require("path");

// get all users
router.get("/users", async (req, res) => {
  let allUsers = [];

  try {
    const users = await db
      .select("*")
      .from("users")
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "users.user_id"
      )
      .columns(["users.user_id"]);

    console.log(users);

    users.map((singleUser) => {
      const user = {
        user_id: singleUser.user_id,
        firstname: singleUser.firstname,
        lastname: singleUser.lastname,
        email: singleUser.email,
        category: singleUser.category,
      };
      if (singleUser.image_id) {
        const dirname = path.resolve();
        const fullfilepath = path.join(dirname, singleUser.filepath);
        user.fullfilepath = fullfilepath;
      }
      allUsers = [...allUsers, user];
    });

    res.status(200).json({ message: "All users", allUsers });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

// update user details
router.patch("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const updatedValue = req.body.updatedValue;
  const { name, value } = updatedValue;

  try {
    await db
      .update({
        [name]: value,
      })
      .from("users")
      .where({ user_id });

    res.status(200).json({ message: "field updated." });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

module.exports = router;

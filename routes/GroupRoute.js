const router = require("express").Router();
const db = require("./database");
const multer = require("multer");

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images/");
    },
    filename: (req, file, cb) => {
      cb(null, new Date().valueOf() + "_" + file.originalname);
    },
  }),
});

router.post("/group", uploadImage.single("image"), async (req, res) => {
  const { group_name, group_description, user_id } = req.body;

  try {
    const group = await db
      .insert({
        group_name,
        group_description,
        user_id,
      })
      .into("group_")
      .returning("*");

    if (req.file) {
      const { filename, path: filepath, mimetype, size } = req.file;
      await db
        .insert({
          group_filename: filename,
          group_filepath: filepath,
          group_mimetype: mimetype,
          group_size: size,
          group_id: group[0].group_id,
        })
        .into("group_image_files");
    }

    res.status(200).json({ message: "Group Created.", group });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

// get all groups for suggestion but without those created or joined by the user
router.get("/all_group/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const allGroups = [];

  try {
    const groups = await db
      .select("*")
      .from("group_")
      .leftOuterJoin(
        "group_image_files",
        "group_image_files.group_id",
        "group_.group_id"
      )
      .leftOuterJoin(
        "joined_group",
        "joined_group.joined_group_id",
        "group_.group_id"
      )
      .whereNot({ user_id });

    groups.forEach((singleGroup) => {
      if (!singleGroup.join_id) {
        const group = {
          group_id: singleGroup.group_id,
          group_name: singleGroup.group_name,
          group_description: singleGroup.group_description,
          user_id: singleGroup.user_id,
        };

        if (singleGroup.group_image_id) {
          group.group_image =
            process.env.ASSETS_BASE_URL + singleGroup.group_filename;
        }
        allGroups.push(group);
      }
    });

    res.status(200).json({ message: "All groups", allGroups });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

router.get("/group/:group_id", async (req, res) => {
  const { group_id } = req.params;

  const singleGroup = {};

  try {
    const group = await db
      .select("*")
      .from("group_")
      .leftOuterJoin(
        "group_image_files",
        "group_image_files.group_id",
        "group_.group_id"
      )
      .where("group_.group_id", "=", group_id);

    singleGroup.group_id = group[0].group_id;
    singleGroup.group_name = group[0].group_name;
    singleGroup.group_description = group[0].group_description;
    singleGroup.user_id = group[0].user_id;
    singleGroup.group_image =
      process.env.ASSETS_BASE_URL + group[0].group_filename;

    res.status(200).json({ message: "Single Group", singleGroup });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

router.get("/user_group/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const allUserGroups = [];

  try {
    const groups = await db
      .select("*")
      .from("group_")
      .leftOuterJoin(
        "group_image_files",
        "group_image_files.group_id",
        "group_.group_id"
      )
      .where("group_.user_id", "=", user_id)
      .column(["group_.group_id"]);

    groups.forEach((singleGroup) => {
      console.log(singleGroup);
      const group = {
        group_id: singleGroup.group_id,
        group_name: singleGroup.group_name,
        group_description: singleGroup.group_description,
        user_id: singleGroup.user_id,
      };
      if (singleGroup.group_image_id) {
        group.group_image =
          process.env.ASSETS_BASE_URL + singleGroup.group_filename;
      }
      allUserGroups.push(group);
    });

    res.status(200).json({ message: "All User created Group", allUserGroups });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

router.post("/group_post", async (req, res) => {
  const { post_id, group_id } = req.body;

  try {
    const groupPost = await db
      .insert({
        post_id,
        group_id,
      })
      .into("group_post")
      .returning("*");

    res.status(200).json({ message: "Post Created", groupPost });
  } catch (error) {
    console.log(error);
  }
});

router.post("/join_group", async (req, res) => {
  const { joined_group_id, joined_user_id } = req.body;

  try {
    const joinedGroup = await db
      .insert({
        joined_user_id,
        joined_group_id,
      })
      .into("joined_group")
      .returning("*");

    res.status(200).json({ message: "Group Joined", joinedGroup });
  } catch (error) {
    res.status(400).json({ message: "Error occured", error });
  }
});

// groups created by user
router.get("/joined_group/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const joinedGroups = [];

  try {
    const groups = await db
      .select("*")
      .from("group_")
      .leftOuterJoin(
        "group_image_files",
        "group_image_files.group_id",
        "group_.group_id"
      )
      .leftOuterJoin(
        "joined_group",
        "joined_group.joined_group_id",
        "group_.group_id"
      )
      .whereNot({ user_id });

    groups.forEach((singleGroup) => {
      if (singleGroup.join_id) {
        const group = {
          group_id: singleGroup.group_id,
          group_name: singleGroup.group_name,
          group_description: singleGroup.group_description,
          user_id: singleGroup.user_id,
        };

        if (singleGroup.group_image_id) {
          group.group_image =
            process.env.ASSETS_BASE_URL + singleGroup.group_filename;
        }
        joinedGroups.push(group);
      }
    });

    res.status(200).json({ message: "All groups", joinedGroups });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

module.exports = router;

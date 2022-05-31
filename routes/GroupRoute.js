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
      .where("group_.user_id", "!=", user_id)
      .column(["group_.user_id", "group_.group_id"]);

    const user = await db
      .select("*")
      .from("users")
      .leftOuterJoin(
        "joined_group",
        "joined_group.joined_user_id",
        "users.user_id"
      )
      .where(function () {
        this.where("users.user_id", "=", user_id).orWhere(
          "joined_group.joined_user_id",
          "=",
          user_id
        );
      })
      .column(["users.user_id", "joined_group.joined_user_id"]);

    const uniqueArray = groups.reduce((finalArray, current) => {
      let obj = finalArray.find((item) => item.group_id === current.group_id);

      if (obj) {
        return finalArray;
      }
      return finalArray.concat([current]);
    }, []);

    groups.forEach((singleGroup) => {
      if (
        singleGroup.joined_user_id !== user[0].user_id &&
        singleGroup.joined_group_id !== user[0].joined_group_id
      ) {
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
    res.status(400).json({ message: "Error creating post.", error });
  }
});

router.get("/single_group_post/:user_id/:group_id", async (req, res) => {
  const { group_id, user_id } = req.params;

  let allGroupPosts = [];

  try {
    const groupPosts = await db
      .select("*")
      .from("group_post")
      .leftOuterJoin("posts", "posts.post_id", "group_post.post_id")
      .leftOuterJoin(
        "post_image_files",
        "post_image_files.post_id",
        "posts.post_id"
      )
      .leftOuterJoin("users", "users.user_id", "posts.user_id")
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "posts.user_id"
      )
      .where("group_post.group_id", "=", group_id)
      .column(["posts.shared_post_id"]);

    const allLikes = await db.select("*").from("like_posts");
    const allDislikes = await db.select("*").from("dislike_posts");

    groupPosts.map((singleGroupPost) => {
      const groupPost = {
        post_id: singleGroupPost.post_id,
        description: singleGroupPost.description,
        created_at: singleGroupPost.created_at,
        firstname: singleGroupPost.firstname,
        lastname: singleGroupPost.lastname,
        user_id: singleGroupPost.user_id,
        post_filename: singleGroupPost.post_filename,
        post_filepath: singleGroupPost.post_filepath,
        post_mimetype: singleGroupPost.post_mimetype,
        post_size: singleGroupPost.post_size,
        post_type: singleGroupPost.post_type,
        shared_user_id: singleGroupPost.shared_user_id,
      };

      allLikes.forEach((like) => {
        if (singleGroupPost.post_id === like.post_id) {
          if (like.user_id === parseInt(user_id)) {
            groupPost.like_post = true;
          }
        }
      });

      allDislikes.forEach((dislike) => {
        if (
          singleGroupPost.post_id === dislike.post_id &&
          dislike.user_id === parseInt(user_id)
        ) {
          groupPost.dislike_post = true;
        }
      });

      if (singleGroupPost.image_id) {
        groupPost.imageUri =
          process.env.ASSETS_BASE_URL + singleGroupPost.post_filename;
      }
      if (singleGroupPost.profile_image_id) {
        groupPost.profile_imageUri =
          process.env.ASSETS_BASE_URL + singleGroupPost.profile_filename;
      }

      allGroupPosts.push(groupPost);
    });

    res.status(200).json({ message: "Group Posts", allGroupPosts });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

// route for getting to group post for displaying group name with post
router.get("/group_post/:post_id", async (req, res) => {
  const { post_id } = req.params;

  try {
    const group_post = await db
      .select("*")
      .from("group_post")
      .where({ post_id });
    res.status(200).json({ message: "All Groups posts", group_post });
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
      .where(function () {
        this.where("group_.user_id", "!=", user_id).andWhere(
          "joined_group.approve_request",
          "=",
          true
        );
      })
      .column(["group_.group_id"]);

    const user = await db.select("*").from("users").where({ user_id });

    groups.forEach((singleGroup) => {
      if (singleGroup.joined_user_id === user[0].user_id) {
        const group = {
          group_id: singleGroup.group_id,
          group_name: singleGroup.group_name,
          group_description: singleGroup.group_description,
          user_id: singleGroup.user_id,
          approve_request: singleGroup.approve_request,
          joined_group_id: singleGroup.joined_group_id,
          joined_user_id: singleGroup.joined_user_id,
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

router.get("/group_members/:group_id", async (req, res) => {
  const { group_id } = req.params;

  const allMembers = [];
  try {
    const members = await db
      .select("*")
      .from("joined_group")
      .leftOuterJoin("users", "users.user_id", "joined_group.joined_user_id")
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "joined_group.joined_user_id"
      )
      .where({ joined_group_id: group_id });

    members.forEach((singleMember) => {
      const member = {
        join_id: singleMember.join_id,
        firstname: singleMember.firstname,
        lastname: singleMember.lastname,
      };
      if (singleMember.profile_image_id)
        member.profile_imageUri =
          process.env.ASSETS_BASE_URL + singleMember.profile_filename;

      allMembers.push(member);
    });

    res.status(200).json({ message: "All group memebers", allMembers });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.patch("/group_update/:group_id", async (req, res) => {
  const { group_id } = req.params;
  const updatedValue = req.body.updatedValue;
  const { name, value } = updatedValue;

  try {
    await db
      .update({
        [name]: value,
      })
      .from("group_")
      .where({ group_id });

    res.status(200).json({ message: "field updated." });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

module.exports = router;

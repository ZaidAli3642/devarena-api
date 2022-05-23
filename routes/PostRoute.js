const router = require("express").Router();
const multer = require("multer");

const getPostDetails = require("../utilities/getPostsDetails");
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

// post something by logged in user.
router.post("/post", imageUpload.single("image"), async (req, res) => {
  const { description, user_id, post_type } = req.body;

  const newPost = {};

  try {
    const post = await db
      .insert({
        description,
        created_at: new Date().getTime(),
        user_id,
        post_type,
      })
      .into("posts")
      .returning("*");

    const user = await db
      .select(["firstname", "lastname"])
      .from("users")
      .where({ user_id });

    const profile_image = await db
      .select("profile_filename")
      .from("profile_image_files")
      .where({ user_id });

    newPost.post_id = post[0].post_id;
    newPost.description = post[0].description;
    newPost.created_at = post[0].created_at;
    newPost.user_id = post[0].user_id;
    newPost.firstname = user[0].firstname;
    newPost.lastname = user[0].lastname;

    if (req.file) {
      const { filename, path: filepath, mimetype, size } = req.file;

      console.log(filename, "\n", filepath);

      const image = await db
        .insert({
          post_filename: filename,
          post_filepath: filepath,
          post_mimetype: mimetype,
          post_size: size,
          post_id: post[0].post_id,
        })
        .into("post_image_files")
        .returning("post_filename");

      newPost.imageUri = process.env.ASSETS_BASE_URL + image[0].post_filename;
      newPost.profile_imageUri =
        process.env.ASSETS_BASE_URL + profile_image[0].profile_filename;
      return res.status(200).send([newPost]);
    } else {
      return res.status(200).send([newPost]);
    }
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

// get specific users posts.
router.get("/post/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let userPosts = [];

  try {
    const allUserPosts = await db
      .select("*")
      .from("posts")
      .leftOuterJoin(
        "post_image_files",
        "post_image_files.post_id",
        "posts.post_id"
      )
      .where({ user_id: user_id })
      .columns(["posts.post_id"]);

    const user = await db.select("*").from("users").where({ user_id });

    const profile_image = await db
      .select("profile_filename")
      .from("profile_image_files")
      .where({ user_id });

    const allLikes = await db.select("*").from("like_posts");
    const allDislikes = await db.select("*").from("dislike_posts");

    allUserPosts.forEach((singlePost) => {
      const post = {
        post_id: singlePost.post_id,
        description: singlePost.description,
        created_at: singlePost.created_at,
        user_id: singlePost.user_id,
        firstname: user[0].firstname,
        lastname: user[0].lastname,
        post_filename: singlePost.post_filename,
        post_filepath: singlePost.post_filepath,
        post_mimetype: singlePost.post_mimetype,
        post_size: singlePost.post_size,
        post_type: singlePost.post_type,
        shared_user_id: singlePost.shared_user_id,
      };

      allLikes.forEach((like) => {
        if (singlePost.post_id === like.post_id) {
          if (like.user_id === parseInt(user_id)) {
            post.like_post = true;
          }
        }
      });

      allDislikes.forEach((dislike) => {
        if (
          singlePost.post_id === dislike.post_id &&
          dislike.user_id === parseInt(user_id)
        ) {
          post.dislike_post = true;
        }
      });

      if (profile_image[0].profile_filename) {
        post.profile_imageUri =
          process.env.ASSETS_BASE_URL + profile_image[0].profile_filename;
      }
      if (singlePost.image_id) {
        post.imageUri = process.env.ASSETS_BASE_URL + singlePost.post_filename;
      }
      userPosts = [...userPosts, post];
    });

    res.status(200).json({ message: "Users posts", userPosts });
  } catch (error) {
    res.json({
      success: false,
      message: "error occured",
      error: error,
    });
  }
});

// get all users posts
router.get("/posts/:user_id/:post_type", async (req, res) => {
  const { user_id, post_type } = req.params;

  try {
    const allPosts = await db
      .select("*")
      .from("posts")
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
      .where({ post_type })
      .columns(["posts.post_id"]);

    const allLikes = await db.select("*").from("like_posts");
    const allDislikes = await db.select("*").from("dislike_posts");

    const allUsersPosts = getPostDetails(
      allPosts,
      allLikes,
      allDislikes,
      user_id
    );

    res.status(200).json({ message: "All users posts.", allUsersPosts });
  } catch (error) {
    res.status(400).json(error);
  }
});

// like and unlike posts.
router.post("/like", async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const likedPosts = await db
      .select("*")
      .from("like_posts")
      .where({ user_id, post_id });

    const dislikePosts = await db
      .select("*")
      .from("dislike_posts")
      .where({ user_id, post_id });

    if (dislikePosts.length) {
      await db.del().from("dislike_posts").where({ user_id, post_id });
    }
    if (likedPosts.length) {
      await db.del().from("like_posts").where({ user_id, post_id });
      return res.status(200).json("unliked");
    }

    await db
      .insert({
        user_id,
        post_id,
      })
      .into("like_posts");
    res.status(200).json("liked");
  } catch (error) {
    res.status(400).json(error);
  }
});

// disliked or un-disliked post.
router.post("/dislike", async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const dislikedPost = await db
      .select("*")
      .from("dislike_posts")
      .where({ user_id, post_id });

    const likePosts = await db
      .select("*")
      .from("like_posts")
      .where({ user_id, post_id });

    if (likePosts.length) {
      await db.del().from("like_posts").where({ user_id, post_id });
    }
    if (dislikedPost.length) {
      await db.del().from("dislike_posts").where({ user_id, post_id });
      return res.status(200).json("disliked remove.");
    }

    await db
      .insert({
        user_id,
        post_id,
      })
      .into("dislike_posts");
    res.status(200).json("Disliked.");
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/share_post", async (req, res) => {
  const { description, user_id, post_type, shared_user_id, shared_post_id } =
    req.body;

  const newPost = {};

  try {
    const post = await db
      .insert({
        description,
        created_at: new Date().getTime(),
        user_id,
        post_type,
        shared_user_id,
        shared_post_id,
      })
      .into("posts")
      .returning("*");

    const user = await db
      .select(["firstname", "lastname"])
      .from("users")
      .where({ user_id });

    newPost.post_id = post[0].post_id;
    newPost.description = post[0].description;
    newPost.created_at = post[0].created_at;
    newPost.user_id = post[0].user_id;
    newPost.shared_user_id = post[0].shared_user_id;
    newPost.shared_post_id = post[0].shared_post_id;
    newPost.firstname = user[0].firstname;
    newPost.lastname = user[0].lastname;

    if (req.body.filename) {
      const { filename, filepath, mimetype, size } = req.body;

      const image = await db
        .insert({
          post_filename: filename,
          post_filepath: filepath,
          post_mimetype: mimetype,
          post_size: size,
          post_id: post[0].post_id,
        })
        .into("post_image_files")
        .returning("post_filename");

      newPost.imageUri = process.env.ASSETS_BASE_URL + image[0].post_filename;

      return res.status(200).send([newPost]);
    } else {
      return res.status(200).send([newPost]);
    }
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

module.exports = router;

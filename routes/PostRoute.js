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

// post something by logged in user.

router.post("/post", imageUpload.single("image"), async (req, res) => {
  const { description, user_id } = req.body;

  try {
    const postId = await db
      .insert({ description, created_at: new Date().getTime(), user_id })
      .into("posts")
      .returning("post_id");

    if (req.file) {
      const { filename, path: filepath, mimetype, size } = req.file;

      await db
        .insert({
          filename,
          filepath,
          mimetype,
          size,
          post_id: postId[0].post_id,
        })
        .into("post_image_files");

      return res.status(200).json({ message: "post created with image." });
    } else {
      return res.status(200).json({ message: "post created without image." });
    }
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

// get users posts.
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;

  let userPosts = [];

  try {
    const posts = await db
      .select("*")
      .from("posts")
      .where({ user_id: userId })
      .leftOuterJoin(
        "post_image_files",
        "post_image_files.post_id",
        "posts.post_id"
      )
      .columns(["posts.post_id"]);

    posts.map((singlePost) => {
      const post = {
        post_id: singlePost.post_id,
        description: singlePost.description,
        created_at: singlePost.created_at,
        user_id: singlePost.user_id,
      };
      if (singlePost.image_id) {
        const dirname = path.resolve();
        const fullfilepath = path.join(dirname, singlePost.filepath);
        post.fullfilepath = fullfilepath;
      }
      userPosts = [...userPosts, post];
    });

    res.status(200).json({ message: "Users posts", userPosts });
  } catch (error) {
    res.json({
      success: false,
      message: "error occured",
      error: error.stack,
    });
  }
});

// get all users posts
router.get("/post", async (req, res) => {
  let allUsersPosts = [];

  try {
    const allPosts = await db
      .select("*")
      .from("posts")
      .leftOuterJoin(
        "post_image_files",
        "post_image_files.post_id",
        "posts.post_id"
      )
      .columns(["posts.post_id"]);

    allPosts.map((singlePost) => {
      const post = {
        post_id: singlePost.post_id,
        description: singlePost.description,
        created_at: singlePost.created_at,
        user_id: singlePost.user_id,
      };
      if (singlePost.image_id) {
        const dirname = path.resolve();
        const fullfilepath = path.join(dirname, singlePost.filepath);
        post.fullfilepath = fullfilepath;
      }
      allUsersPosts = [...allUsersPosts, post];
    });

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

router.get("/like/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const usersLikes = await db
      .select("*")
      .from("like_posts")
      .where({ user_id });

    res
      .status(200)
      .json({ message: "All users liked posts.", usersLike: usersLikes });
  } catch (error) {
    res.status(400).json({ message: "Error occured", error });
  }
});

router.get("/dislike/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const userDislikes = await db
      .select("*")
      .from("dislike_posts")
      .where({ user_id });

    res
      .status(200)
      .json({ message: "All users disliked posts.", usersLike: userDislikes });
  } catch (error) {
    res.status(400).json({ message: "Error occured", error });
  }
});

module.exports = router;

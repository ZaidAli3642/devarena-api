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

  const newPost = {};

  try {
    const post = await db
      .insert({ description, created_at: new Date().getTime(), user_id })
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
    newPost.firstname = user[0].firstname;
    newPost.lastname = user[0].lastname;

    if (req.file) {
      const { filename, path: filepath, mimetype, size } = req.file;

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

// get specific users posts.
router.get("/post/:userId", async (req, res) => {
  const { userId } = req.params;
  let userPosts = [];

  try {
    const posts = await db
      .select("*")
      .from("posts")
      .leftOuterJoin(
        "post_image_files",
        "post_image_files.post_id",
        "posts.post_id"
      )
      .where({ user_id: userId })
      .columns(["posts.post_id"]);

    // if (profile_image) {
    //   post.profile_imageUri =
    //     process.env.ASSETS_BASE_URL + singlePost.profile_filename;
    // }

    const allLikes = await db.select("*").from("like_posts");
    const allDislikes = await db.select("*").from("dislike_posts");
    posts.map((singlePost) => {
      const post = {
        post_id: singlePost.post_id,
        description: singlePost.description,
        created_at: singlePost.created_at,
        firstname: singlePost.firstname,
        lastname: singlePost.lastname,
        user_id: singlePost.user_id,
      };

      allLikes.forEach((like) => {
        if (
          singlePost.post_id === like.post_id &&
          singlePost.user_id === parseInt(userId)
        ) {
          post.like_post = true;
        }
      });

      allDislikes.forEach((dislike) => {
        if (
          singlePost.post_id === dislike.post_id &&
          singlePost.user_id === parseInt(userId)
        ) {
          post.dislike_post = true;
        }
      });

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
      error: error.stack,
    });
  }
});

// get all users posts
router.get("/posts/:user_id", async (req, res) => {
  const { user_id } = req.params;

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
      .leftOuterJoin("users", "users.user_id", "posts.user_id")
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "posts.user_id"
      )
      .columns(["posts.post_id"]);

    const allComments = await db
      .select("*")
      .from("post_comments")
      .leftOuterJoin("users", "users.user_id", "post_comments.user_id")
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "users.user_id"
      );

    const allLikes = await db.select("*").from("like_posts");
    const allDislikes = await db.select("*").from("dislike_posts");

    allPosts.map((singlePost) => {
      const post = {
        post_id: singlePost.post_id,
        description: singlePost.description,
        created_at: singlePost.created_at,
        firstname: singlePost.firstname,
        lastname: singlePost.lastname,
        user_id: singlePost.user_id,
        comments: [],
      };

      allComments.forEach((comments) => {
        const comment = {
          comment_id: comments.comment_id,
          description: comments.description,
          user_id: comments.user_id,
          post_id: comments.post_id,
          firstname: comments.firstname,
          lastname: comments.lastname,
        };
        if (singlePost.post_id === comments.post_id) {
          if (comments.profile_image_id) {
            comment.profile_image =
              process.env.ASSETS_BASE_URL + comments.profile_filename;
          }
          post.comments.push(comment);
        }
      });

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

      if (singlePost.image_id) {
        post.imageUri = process.env.ASSETS_BASE_URL + singlePost.post_filename;
      }
      if (singlePost.profile_image_id) {
        post.profile_imageUri =
          process.env.ASSETS_BASE_URL + singlePost.profile_filename;
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

router.get("/like", async (req, res) => {
  try {
    const allPostLikes = await db.select("*").from("like_posts");
    res.status(200).json(allPostLikes);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;

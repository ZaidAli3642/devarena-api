const router = require("express").Router();
const db = require("./database");

// comments on posts route
router.post("/comment", async (req, res) => {
  const { description, user_id, post_id } = req.body;

  try {
    await db
      .insert({
        description,
        created_at: new Date().getTime(),
        user_id,
        post_id,
      })
      .into("post_comments");

    res.status(200).json({ message: "Comment created." });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// get single post comments and comments responses
router.get("/comment/:post_id", async (req, res) => {
  const { post_id } = req.params;

  let allComments = [];

  try {
    const comments = await db
      .select("*")
      .from("post_comments")
      .where({ post_id })
      .leftOuterJoin("users", "users.user_id", "post_comments.user_id");

    const commentResponses = await db
      .select("*")
      .from("post_comments_responses");

    const commentsAndResponses = await Promise.all([
      comments,
      commentResponses,
    ]);

    commentsAndResponses[0].map((singleComment) => {
      const comment = {
        ...singleComment,
        comment_response: [],
      };

      commentsAndResponses[1].forEach((singleResponse) => {
        if (singleComment.comment_id === singleResponse.comment_id) {
          comment.comment_response.push(singleResponse);
        }
      });
      allComments.push(comment);
    });

    res.status(200).json({ message: "All Comments", allComments });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

// like post comments
router.post("/like_comments", async (req, res) => {
  const { user_id, comment_id } = req.body;

  try {
    const likedComments = await db
      .select("*")
      .from("like_comments")
      .where({ user_id, comment_id });

    if (likedComments.length) {
      await db.del().from("like_comments").where({ user_id, comment_id });
      return res.status(200).json("like removed.");
    }

    await db
      .insert({
        user_id,
        comment_id,
      })
      .into("like_comments");
    res.status(200).json("liked comment.");
  } catch (error) {
    res.status(400).json({ message: "Error occured", error });
  }
});

// like comments for specific user
router.get("/like_comments/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const usersLikes = await db
      .select("*")
      .from("like_comments")
      .where({ user_id });

    res.status(200).json({ message: "All users liked comments.", usersLikes });
  } catch (error) {
    res.status(400).json({ message: "Error occured", error });
  }
});

// post comment responses

router.post("/comment_response", async (req, res) => {
  const { description, user_id, comment_id } = req.body;

  try {
    await db
      .insert({
        description,
        created_at: new Date().getTime(),
        user_id,
        comment_id,
      })
      .into("post_comments_responses");

    res.status(200).json({ message: "Comment response created." });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

module.exports = router;

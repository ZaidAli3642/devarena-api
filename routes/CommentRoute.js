const router = require("express").Router();
const db = require("./database");

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

router.get("/comment/:post_id", async (req, res) => {
  const { post_id } = req.params;

  try {
    const comments = await db
      .select("*")
      .from("post_comments")
      .where({ post_id })
      .leftOuterJoin("users", "users.user_id", "post_comments.user_id");

    res.status(200).json({ message: "All Comments", comments });
  } catch (error) {
    res.status(400).json({ message: "error occured.", error });
  }
});

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

module.exports = router;

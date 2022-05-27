const router = require("express").Router();
const db = require("./database");

router.post("/request", async (req, res) => {
  const {
    joined_user_id,
    joined_group_id,
    joined_firstname,
    joined_group_name,
    user_id,
  } = req.body;

  try {
    const request = await db
      .insert({
        joined_group_id,
        joined_user_id,
        approve_request: false,
        joined_firstname,
        joined_group_name,
        message: "wants to join",
        user_id,
      })
      .into("joined_group")
      .returning("*");

    res.status(200).json({ message: "Request", request });
  } catch (error) {}
});

router.get("/request/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const allRequests = await db
      .select("*")
      .from("joined_group")
      .where(function () {
        this.where("joined_group.user_id", "=", user_id).andWhere(
          "joined_group.approve_request",
          "=",
          false
        );
      });
    res.status(200).json({ message: "All Requests", allRequests });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.patch("/approve/:join_id", async (req, res) => {
  const { join_id } = req.params;

  try {
    const approvedRequest = await db
      .update({
        approve_request: true,
      })
      .from("joined_group")
      .where({ join_id })
      .returning("*");

    res.status(200).json({ message: "Approved Request.", approvedRequest });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

module.exports = router;

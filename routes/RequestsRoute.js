const router = require("express").Router();
const db = require("./database");

router.post("/request", async (req, res) => {
  const {
    joined_user_id,
    joined_group_id,
    joined_firstname,
    joined_group_name,
    user_id,
    approve_request = false,
  } = req.body;

  try {
    const request = await db
      .insert({
        joined_group_id,
        joined_user_id,
        approve_request,
        joined_firstname,
        joined_group_name,
        message: "wants to join",
        user_id,
      })
      .into("joined_group")
      .returning("*");

    res.status(200).json({ message: "Request", request });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
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
    console.log(allRequests);
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

router.delete("/remove_members/:join_id", async (req, res) => {
  const { join_id } = req.params;
  try {
    const removed = await db.del().from("joined_group").where({ join_id });
    res.status(200).json({ message: "Removed User from group", removed });
  } catch (error) {
    console.log(error);
  }
});

router.post("/follow_request", async (req, res) => {
  const { follow_user_id, follow_firstname, user_id } = req.body;

  try {
    const request = await db
      .insert({
        follow_user_id,
        follow_firstname,
        approve_request: false,
        user_id,
        message: "want to follow you",
      })
      .into("follow_request")
      .returning("*");

    console.log(request);
    res.status(200).json({ message: "Request", request });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.get("/follow_request/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const allRequests = await db
      .select("*")
      .from("follow_request")
      .where(function () {
        this.where("follow_request.user_id", "=", user_id).andWhere(
          "follow_request.approve_request",
          "=",
          false
        );
      });
    res.status(200).json({ message: "All Requests", allRequests });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.patch("/approve_follow/:follow_id", async (req, res) => {
  const { follow_id } = req.params;

  try {
    const approvedRequest = await db
      .update({
        approve_request: true,
      })
      .from("follow_request")
      .where({ follow_id })
      .returning("*");

    res.status(200).json({ message: "Request Approved.", approvedRequest });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.delete("/reject_request/:follow_id", async (req, res) => {
  const { follow_id } = req.params;

  try {
    await db.del().from("follow_request").where({ follow_id });
    res.status(200).json({ message: "Request Rejected." });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.get("/followers/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const allFollowers = [];

  try {
    const followers = await db
      .select("*")
      .from("users")
      .leftOuterJoin(
        "follow_request",
        "follow_request.follow_user_id",
        "users.user_id"
      )
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "follow_request.follow_user_id"
      )
      .where(function () {
        this.where("follow_request.user_id", "=", user_id).andWhere(
          "follow_request.approve_request",
          "=",
          true
        );
      })
      .column(["users.user_id"]);

    followers.forEach((singleFollower) => {
      const follower = {
        user_id: singleFollower.user_id,
        firstname: singleFollower.firstname,
        lastname: singleFollower.lastname,
      };
      if (singleFollower.profile_image_id)
        follower.profile_imageUri =
          process.env.ASSETS_BASE_URL + singleFollower.profile_filename;

      allFollowers.push(follower);
    });

    res.status(200).json({ message: "Followers", allFollowers });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.get("/following/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const allFollowings = [];

  try {
    const followings = await db
      .select("*")
      .from("users")
      .leftOuterJoin(
        "follow_request",
        "follow_request.user_id",
        "users.user_id"
      )
      .leftOuterJoin(
        "profile_image_files",
        "profile_image_files.user_id",
        "follow_request.user_id"
      )
      .where(function () {
        this.where("follow_request.follow_user_id", "=", user_id).andWhere(
          "follow_request.approve_request",
          "=",
          true
        );
      })
      .column(["users.user_id"]);

    followings.forEach((singleFollowing) => {
      const following = {
        user_id: singleFollowing.user_id,
        firstname: singleFollowing.firstname,
        lastname: singleFollowing.lastname,
      };
      if (singleFollowing.profile_image_id)
        following.profile_imageUri =
          process.env.ASSETS_BASE_URL + singleFollowing.profile_filename;

      allFollowings.push(following);
    });

    res.status(200).json({ message: "Followings.", allFollowings });
  } catch (error) {
    res.status(400).json({ message: "Error occured.", error });
  }
});

router.get("/check_request", async (req, res) => {
  const follow_user_id = req.query.follow_user_id;
  const user_id = req.query.user_id;

  const followRequestUser = await db
    .select("*")
    .from("follow_request")
    .where(function () {
      this.where("follow_request.follow_user_id", "=", follow_user_id).andWhere(
        "follow_request.user_id",
        "=",
        user_id
      );
    });

  res.status(200).json({ message: "Follow Request User.", followRequestUser });
});

router.get("/allFollowersFollowing/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const allFollowUsers = [];

  const followersAndFollowings = await db
    .select("*")
    .from("follow_request")
    .leftOuterJoin("users", "users.user_id", "follow_request.follow_user_id")
    .leftOuterJoin(
      "profile_image_files",
      "profile_image_files.user_id",
      "follow_request.follow_user_id"
    )
    .leftOuterJoin(
      "joined_group",
      "joined_group.joined_user_id",
      "follow_request.follow_user_id"
    )
    .where(function () {
      this.where("follow_request.follow_user_id", "=", user_id).orWhere(
        "follow_request.user_id",
        "=",
        user_id
      );
    })
    .andWhere("follow_request.approve_request", "=", true)
    .column(["users.user_id"]);

  const result = followersAndFollowings.reduce((finalArray, current) => {
    let obj = finalArray.find((item) => item.user_id === current.user_id);

    if (obj) {
      return finalArray;
    }
    return finalArray.concat([current]);
  }, []);

  result.forEach((singleUser) => {
    const user = {
      user_id: singleUser.user_id,
      firstname: singleUser.firstname,
      lastname: singleUser.lastname,
      joined_group_id: singleUser.joined_group_id,
      approve_request: singleUser.approve_request,
    };
    if (singleUser.profile_image_id)
      user.profile_imageUri =
        process.env.ASSETS_BASE_URL + singleUser.profile_filename;

    allFollowUsers.push(user);
  });

  res
    .status(200)
    .json({ message: "All Followed and Following users.", allFollowUsers });
});

module.exports = router;

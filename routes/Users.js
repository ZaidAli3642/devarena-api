const router = require("express").Router();

router.get("/users", (req, res) => {
  res.status(200).json("users route");
});

module.exports = router;

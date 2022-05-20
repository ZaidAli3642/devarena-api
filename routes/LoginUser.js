const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database");

// login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.select("*").from("users").where("email", "=", email);

    console.log(user);
    if (user.length === 0) {
      return res.status(200).json({ message: "Email is not registered." });
    } else {
      const passwordHash = await db
        .select("password_hash")
        .from("login")
        .where("user_id", "=", user[0].user_id);

      bcrypt.compare(password, passwordHash[0].password_hash, (err, result) => {
        if (err) return new Error("Error comparing password.");

        if (result) {
          jwt.sign(user[0], "secret", (err, token) => {
            if (err) return new Error("Error generating token");

            return res.status(200).json({ token });
          });
        } else {
          return res.status(200).json({ message: "Password not matched." });
        }
      });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router;

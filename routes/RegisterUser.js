const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database");

// register route
router.post("/register", (req, res) => {
  const { firstname, lastname, email, category, password } = req.body;

  try {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.status(400).json("Error generating salt");

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) return res.status(400).json("Error generating hash");

        const loginDetails = await db
          .insert({ firstname, lastname, email, category })
          .into("users")
          .returning("*");

        await db
          .insert({
            user_id: loginDetails[0].user_id,
            password_hash: hash,
          })
          .into("login");

        jwt.sign(loginDetails[0], "secret", (err, result) => {
          if (err) return new Error(err);
          return res.status(200).json({ token: result });
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;

// db.transaction((trx) => {
//   trx
//     .insert({})
//     .into("users")
//     .returning("*")
//     .then((loginDetails) => {
//       db.insert({
//         user_id: loginDetails[0].user_id,
//         password_hash: hash,
//       })
//         .into("login")
//         .then(() => {
//           jwt.sign(loginDetails[0], "secret", (err, result) => {
//             if (err) return new Error(err);
//             return res.status(200).json({ token: result });
//           });
//         });
//     })
//     .then(trx.commit)
//     .catch(trx.rollback);
// }).catch((err) => res.status(400).json({ message: "Hello", err }));

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database");

router.post("/register", (req, res) => {
  const { firstname, lastname, email, category, password } = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return new Error("Error generating salt.");

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) return new Error("Error generating hash");

      db.transaction((trx) => {
        trx
          .insert({
            firstname,
            lastname,
            email,
            category,
          })
          .into("users")
          .returning("*")
          .then((loginDetails) => {
            db.insert({
              user_id: loginDetails[0].user_id,
              password_hash: hash,
            })
              .into("login")
              .then(() => {
                jwt.sign(loginDetails[0], "secret", (err, result) => {
                  if (err) return new Error(err);
                  return res.status(200).json(result);
                });
              });
          })
          .then(trx.commit)
          .catch(trx.rollback);
      }).catch((err) => res.status(400).json(err));
    });
  });
});

module.exports = router;

const router = require("express").Router();
const nodemailer = require("nodemailer");
const db = require("./database");

const generateRandomNumber = require("../utilities/generateRandomNumber");

router.post("/email_verify", async (req, res) => {
  const { email } = req.body;

  const sixDigitCode = generateRandomNumber();

  try {
    const user = await db.select("*").from("users").where({ email });

    if (user.length)
      return res.status(200).json({ message: "User already exist." });

    const transport = nodemailer.createTransport({
      service: "Gmail",
      port: 587,
      auth: {
        user: process.env.AUTH_USERNAME,
        pass: process.env.AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: `DevArena ${process.env.AUTH_USERNAME}`,
      to: email,
      subject: "Email Confirmation",
      html: `Enter this six digit code ${sixDigitCode} for confirm your email. Thanks!`,
    };

    transport.sendMail(mailOptions, (err, response) => {
      if (err) {
        return res.status(400).json({ message: "Error sending email." });
      }

      res.status(200).json({
        sixDigitCode,
        message: "Email sent.",
      });
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Something wrong happened.", error: error });
  }
});

module.exports = router;

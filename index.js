const config = require("config");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const registerUserRoute = require("./routes/RegisterUser");
const loginUserRoute = require("./routes/LoginUser");
const profileImageRoute = require("./routes/ProfileImageRoute");
const emailVerificationRoute = require("./routes/EmailVerificationRoute");
const postRoute = require("./routes/PostRoute");
const usersRoute = require("./routes/Users");
const commentRoute = require("./routes/CommentRoute");
const groupRoute = require("./routes/GroupRoute");
const requestRoute = require("./routes/RequestsRoute");

const app = express();

app.use(`/images`, express.static("images"));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
// app.use(expressfileupload());
app.use(morgan("dev"));

app.use("/api", registerUserRoute);
app.use("/api", loginUserRoute);
app.use("/api", profileImageRoute);
app.use("/api", emailVerificationRoute);
app.use("/api", postRoute);
app.use("/api", usersRoute);
app.use("/api", commentRoute);
app.use("/api", groupRoute);
app.use("/api", requestRoute);

const port = process.env.PORT || config.get("port");

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});

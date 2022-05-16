const config = require("config");
const express = require("express");
const morgan = require("morgan");

const registerUserRoute = require("./routes/RegisterUser");
const loginUserRoute = require("./routes/LoginUser");
const profileImageRoute = require("./routes/ProfileImageRoute");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use(registerUserRoute);
app.use(loginUserRoute);
app.use(profileImageRoute);

const port = process.env.PORT || config.get("port");

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});

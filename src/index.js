const express = require('express');
const app = express();

const isochrone = require("./isochrone");

const PORT = 3000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res, next) {
  const latitude = parseFloat(req.query.latitude);
  const longitude = parseFloat(req.query.longitude);
  const time = parseInt(req.query.time);
  const mode = req.query.mode;
  if (mode == null) {
    res.json({
      error: true,
      message: "'mode' param not specified, must be either 'bicycling', 'driving' or 'walking'.",
    });
  }
  if (latitude == null || isNaN(latitude)) {
    res.json({
      error: true,
      message: "'latitude' param not specified or not a number.",
    });
  }
  if (longitude == null || isNaN(longitude)) {
    res.json({
      error: true,
      message: "'longitude' param not specified or not a number.",
    });
  }
  if (time == null || isNaN(time)) {
    res.json({
      error: true,
      message: "'time' param not specified or not a number.",
    });
  }

  isochrone([longitude, latitude], mode, time)
    .then(result => {
      res.json(result)
      next();
    })
    .catch((err) => {
      res.json({
        error: true,
        message: "Request failed.",
        cause: err,
      });
      next();
    });
});

app.listen(PORT, function () {
  console.log(`Isochrones is running on port ${PORT}.`);
});
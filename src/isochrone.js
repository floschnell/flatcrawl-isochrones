const helpers = require("@turf/helpers");
const destination = require("@turf/destination").default;
const distance = require("@turf/distance").default;
const bbox = require("@turf/bbox").default;
const pointGrid = require("@turf/point-grid").default;
const fetch = require("node-fetch").default;
const concave = require("@turf/concave").default;

const CONFIGURATIONS = {
  walking: {
    endpoint: process.env.OSRM_ENDPOINT_WALKING,
    max_speed: 10,
  },
  bicycling: {
    endpoint: process.env.OSRM_ENDPOINT_BICYCLING,
    max_speed: 25,
  },
  driving: {
    endpoint: process.env.OSRM_ENDPOINT_DRIVING,
    max_speed: 80,
  },
}

/**
 * Calculates an area which could be travelled in a certain amount of time given.
 * See here: https://en.wikipedia.org/wiki/Isochrone_map
 * Inspiration taken from: https://github.com/mapbox/osrm-isochrone/blob/master/index.js
 * 
 * @param {[number, number]} centerCoords Longitude and latitude of the starting point.
 * @param {string} mode Travelling mode. One of "bicycling", "driving" or "walking".
 * @param {number} time Number of minutes travelled from centerCoords into all directions.
 */
function isochrone(centerCoords, mode, time) {
  const endpoint = CONFIGURATIONS[mode].endpoint;
  const center = helpers.point(centerCoords);
  const max_speed = CONFIGURATIONS[mode].max_speed; // units per hour
  const units = "kilometers";
  const resolution = process.env.NUMBER_OF_GRID_CELLS;

  const maxDistance = max_speed / 3600 * time;
  const spokes = helpers.featureCollection([
    destination(center, maxDistance, 0, {
      units
    }),
    destination(center, maxDistance, 90, {
      units
    }),
    destination(center, maxDistance, 180, {
      units
    }),
    destination(center, maxDistance, -90, {
      units
    }),
  ]);
  const boundingBox = bbox(spokes);
  const gridCellSize = maxDistance * 2 / resolution;
  const grid = pointGrid(boundingBox, gridCellSize, {
    units
  });
  grid.features.push(center);

  const coords = grid.features
    .map(feature => feature.geometry.coordinates)
    .filter((coord) => distance(helpers.point(coord), center) < maxDistance);
  const coordString = coords.map(coord => `${coord[0]},${coord[1]}`).join(";");

  return fetch(`${endpoint}/table/v1/walk/${coordString}?sources=${coords.length-1}`)
    .then(r => r.json())
    .then(data => {
      const results = helpers.featureCollection(
        data.durations[0].map((duration, i) => helpers.point(data.destinations[i].location, {
          duration
        }))
        .filter(point => point.properties.duration < time)
      );
      return concave(results, {
        maxEdge: gridCellSize * 2,
        units
      });
    });
}

module.exports = isochrone;
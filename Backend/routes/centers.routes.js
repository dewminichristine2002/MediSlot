const router = require("express").Router();
const c = require("../controllers/centers.controller");

router.get("/", c.listCenters);              // list + filters + openNow
router.get("/nearby", c.nearbyCenters);      // geo
router.get("/:id", c.getCenterById);         // details
router.get("/:id/tests", c.getCenterTests);  // tests offered by center

// admin
router.post("/", c.createCenter);
router.put("/:id", c.updateCenter);

module.exports = router;

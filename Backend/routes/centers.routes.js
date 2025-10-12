const router = require("express").Router();
const c = require("../controllers/centers.controller");

router.get('/names', c.getHealthCenterNames);

// public
router.get("/", c.listCenters);
router.get("/nearby", c.nearbyCenters);
router.get("/:id", c.getCenterById);
router.get("/:id/tests", c.getCenterTests); // merged Test + per-center fields (supports ?lang=si)

// admin
router.post("/", c.createCenter);
router.put("/:id", c.updateCenter);


module.exports = router;

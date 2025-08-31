const router = require("express").Router();
const s = require("../controllers/centerService.controller");

// query centers that offer a given test (by name)
router.get("/by-test", s.centersByTestName);

// admin: link/unlink or update mapping
router.post("/", s.attachTestToCenter);
router.put("/:id", s.updateCenterService);

module.exports = router;

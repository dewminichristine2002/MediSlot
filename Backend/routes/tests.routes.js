const router = require("express").Router();
const t = require("../../controllers/tests.controller");

router.get("/", t.listTests);
router.post("/", t.createTest);
router.put("/:id", t.updateTest);

module.exports = router;

const express = require("express");
const ctrl = require("../../controllers/LabTests/healthAwarenessController.js");

const r = express.Router();

r.get("/", ctrl.list);
r.get("/:id", ctrl.getOne);
r.post("/", ctrl.create);
r.put("/:id", ctrl.update);
r.delete("/:id", ctrl.remove);

module.exports = r;

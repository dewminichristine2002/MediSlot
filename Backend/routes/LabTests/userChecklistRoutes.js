const express = require("express");
const ctrl = require("../../controllers/LabTests/userChecklistController.js");

const r = express.Router();

// create from a Test’s checklist
r.post("/", ctrl.createFromTest);          // body: { userId, testId }
// read
r.get("/", ctrl.listForUser);              // query: ?userId=... [&testId=...]
r.get("/:id", ctrl.getOne);                // by checklist doc id
// toggle one item
r.patch("/:id/items/:key", ctrl.toggleItem); // body: { value: true|false }
// reset all to false
r.post("/:id/reset", ctrl.resetAll);
// delete checklist
r.delete("/:id", ctrl.remove);

module.exports = r;

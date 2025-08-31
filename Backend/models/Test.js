// Test.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const TestSchema = new Schema({
  testId: { type: String, unique: true, required: true }, // e.g. "FBS01"
  name: String,                                          // Test name
  what: String,                                          // What is this test?
  why: String,                                           // Why is it done?
  preparation: [String],                                 // Steps before the test
  during: [String],                                      // What happens during the test
  after: [String],                                       // Instructions after the test
  checklist: [                                           // Default checklist items
    {
      key: String,                                      
      label: String,                                     
      isMandatory: Boolean
    }
  ],
  mediaUrl :String
}, { timestamps: true });

export default model("Test", TestSchema);

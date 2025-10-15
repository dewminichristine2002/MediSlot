// src/components/BookingForm.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api";

const BookingForm = ({ onClose, reload }) => {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({
    patientName: "",
    testId: "",
    price: "",
    paymentStatus: "pay at center",
  });

  const loadTests = async () => {
    try {
      const res = await api.get("/lab/tests");
      setTests(res.data || []);
    } catch (err) {
      console.error("Failed to load tests", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/lab/bookings", form);
      reload();
      onClose();
    } catch (err) {
      console.error("Failed to create booking", err);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow">
        <h2 className="text-lg font-semibold mb-4">Add Manual Booking</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Patient Name"
            value={form.patientName}
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <select
            value={form.testId}
            onChange={(e) => {
              const selected = tests.find((t) => t._id === e.target.value);
              setForm({
                ...form,
                testId: e.target.value,
                price: selected?.price || "",
              });
            }}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Test</option>
            {tests.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.paymentStatus}
            onChange={(e) =>
              setForm({ ...form, paymentStatus: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="pay at center">Pay at Center</option>
            <option value="online">Online</option>
          </select>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

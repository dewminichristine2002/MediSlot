// src/components/BookingTable.jsx
import React from "react";
import { api } from "../api";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function BookingTable({ bookings, loading, reload }) {
  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/lab/bookings/${id}/status`, { status: newStatus });
      reload();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Patient</th>
            <th className="p-3 text-left">Test</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Payment</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center p-4 text-gray-500">
                No bookings found
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{new Date(b.date).toLocaleDateString()}</td>
                <td className="p-3">{b.patientName}</td>
                <td className="p-3">{b.testName}</td>
                <td className="p-3">Rs. {b.price}</td>
                <td className="p-3">
                  {b.paymentStatus === "online" ? (
                    <span className="text-green-600 font-semibold">Online</span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      Pay @ Center
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      statusColors[b.status] || ""
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="p-3">
                  {b.status !== "Completed" && (
                    <button
                      onClick={() => updateStatus(b._id, "Completed")}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Mark Complete
                    </button>
                  )}
                  {b.status !== "Cancelled" && (
                    <button
                      onClick={() => updateStatus(b._id, "Cancelled")}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

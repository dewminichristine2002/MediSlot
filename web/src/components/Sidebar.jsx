import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/free-events">Free Events</NavLink>
      <NavLink to="/guidelines">Guidelines</NavLink>
      <NavLink to="/centers">Centers</NavLink>
      <NavLink to="/admin/health-awareness">Health Awareness</NavLink>
    </aside>
  );
}

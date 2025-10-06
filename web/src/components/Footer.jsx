import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-modern">
      <div className="footer-left">
        <span className="brand">MediSlot Admin</span>
        <span className="dot">•</span>
        <span>© {year}</span>
      </div>

      <div className="footer-center">
        <a href="/home">Home</a>
        <a href="/free-events">Free Events</a>
        <a href="/guidelines">Guidelines</a>
        <a href="/centers">Centers</a>
      </div>

      <div className="footer-right">
        <span className="powered">
          Powered by <strong>MediSlot</strong>
        </span>
      </div>
    </footer>
  );
}

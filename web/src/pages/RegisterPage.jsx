import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_no: "",
    address: "",
    user_category: "admin",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!form.name || !form.email || !form.password) {
      return setErr("Name, email, and password are required.");
    }
    if (form.password.length < 6) {
      return setErr("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return setErr("Passwords do not match.");
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        contact_no: form.contact_no.trim() || undefined,
        address: form.address.trim() || undefined,
        user_category: form.user_category,
        password: form.password,
      };

      await api.post("/users/auth/register", payload);
      setOk("User registered successfully!");
      setForm({
        name: "",
        email: "",
        contact_no: "",
        address: "",
        user_category: "admin",
        password: "",
        confirmPassword: "",
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message === "Duplicate email"
          ? "Email already exists."
          : e?.response?.data?.message ||
            e?.message ||
            "Registration failed.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <h2>Create Account</h2>

        {err && <div style={{ color: "#b91c1c", fontWeight: 600 }}>{err}</div>}
        {ok && <div style={{ color: "#16a34a", fontWeight: 600 }}>{ok}</div>}

        <input
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={onChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
        />
        <input
          name="contact_no"
          placeholder="Contact number"
          value={form.contact_no}
          onChange={onChange}
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={onChange}
        />

        <select
          name="user_category"
          value={form.user_category}
          onChange={onChange}
        >
          <option value="admin">Admin</option>
          <option value="healthCenterAdmin">Health Center</option>
          <option value="patient">Patient</option>
        </select>

        {/* Password Field with Eye Toggle */}
        <div className="password-wrapper">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={onChange}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {/* Confirm Password Field with Eye Toggle */}
        <div className="password-wrapper">
          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={onChange}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label="Toggle confirm password visibility"
          >
            {showConfirm ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register"}
        </button>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            type="button"
            className="btn"
            style={{ background: "#6b7280" }}
            onClick={() => navigate("/")}
          >
            Go to Login
          </button>
          <Link to="/home" className="btn" style={{ textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}

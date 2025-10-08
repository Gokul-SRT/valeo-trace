import React, { useState } from "react";
import { connect } from "react-redux";
import { Input, Button, Form, message } from "antd";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import image from "../assets/bgmobile.jpg";
import logo from "../assets/logo.png";

const mapStateToProps = ({ user, settings }) => ({
  user,
  authProvider: settings.authProvider,
  logo: settings.logo,
});

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("login"); // login | forgot | reset
  const [email, setEmail] = useState("");

  // 🔑 Login handler
  const onFinishLogin = (values) => {
    const { username, password } = values;

    if (username === "smartrun" && password === "sradmin") {
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("username", username);
      message.success("Login successful! Redirecting to dashboard...");
      navigate("/productionReports");
    } else {
      message.error("Invalid credentials");
    }
  };

  const onSendOtp = (values) => {
    setEmail(values.email);
    message.success(`OTP sent to ${values.email}`);
    setStep("reset");
  };

  const onResetPassword = (values) => {
    if (values.otp === "123456") {
      message.success("Password reset successful! Please login again.");
      setStep("login");
    } else {
      message.error("Invalid OTP, please try again.");
    }
  };

  return (
    <div
      className="vh-100 d-flex flex-column"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Navbar */}
      <nav className="navbar navbar-light bg-white shadow-sm px-3">
        <div className="d-flex align-items-center">
          <img src={logo} alt="SmartRun Logo" height="40" className="me-2" />
          <span className="fw-bold fs-5 text-dark">
            <span style={{ color: "#ff5d22" }}>Smart</span>
            <span className="text-primary">Run</span>
          </span>
        </div>
      </nav>

      {/* ✅ Body */}
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div
          className="card shadow-lg p-4 p-md-5"
          style={{ maxWidth: "450px", width: "100%", borderRadius: "12px" }}
        >
          {/* Title */}
          <div className="text-center mb-4">
            <strong className="fs-3 text-dark">
              <span style={{ color: "#ff5d22" }}>Smart</span>
              <span className="text-primary">Run </span>Traceability
            </strong>
          </div>

          {/* Dynamic content */}
          {step === "login" && (
            <>
              <div className="mb-3 text-dark">
                <strong>Sign in</strong>
              </div>
              <Form
                layout="vertical"
                onFinish={onFinishLogin}
                // initialValues={{ username: "smartrun", password: "sradmin" }}
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: "Please input your username" }]}
                >
                  <Input size="large" placeholder="Username" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "Please input your password" }]}
                >
                  <Input.Password size="large" placeholder="Password" />
                </Form.Item>
                <Button type="primary" size="large" className="w-100" htmlType="submit">
                  <strong>Sign in</strong>
                </Button>
              </Form>

              <div className="text-center mt-3">
                <span
                  className="text-primary"
                  style={{ cursor: "pointer" }}
                  onClick={() => setStep("forgot")}
                >
                  Forgot Password?
                </span>
              </div>
            </>
          )}

          {step === "forgot" && (
            <>
              <div className="mb-3 text-dark">
                <strong>Forgot Password</strong>
              </div>
              <Form layout="vertical" onFinish={onSendOtp}>
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: "Please enter your email" }]}
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Send OTP
                </Button>
              </Form>
              <div className="text-center mt-3">
                <span
                  style={{ cursor: "pointer" }}
                  className="text-secondary"
                  onClick={() => setStep("login")}
                >
                  Back to Login
                </span>
              </div>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="mb-3 text-dark">
                <strong>Reset Password</strong>
              </div>
              <Form layout="vertical" onFinish={onResetPassword}>
                <Form.Item
                  name="otp"
                  rules={[{ required: true, message: "Enter the OTP" }]}
                >
                  <Input placeholder="Enter OTP (123456)" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  rules={[{ required: true, message: "Enter new password" }]}
                >
                  <Input.Password placeholder="New Password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Reset Password
                </Button>
              </Form>
              <div className="text-center mt-3">
                <span
                  style={{ cursor: "pointer" }}
                  className="text-secondary"
                  onClick={() => setStep("login")}
                >
                  Back to Login
                </span>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center mt-4">
            <small>
              Software rights owned by{" "}
              <span className="text-danger">Smart</span>
              <span className="text-primary">Run</span> Tech Pvt Ltd.,
            </small>
            <br />
            <a
              href="https://www.smartruntech.com/"
              className="text-decoration-none"
              target="_blank"
              rel="noreferrer"
            >
              www.smartruntech.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(Login);

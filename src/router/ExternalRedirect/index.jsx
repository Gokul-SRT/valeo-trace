import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Button, Typography } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import image from "../../assets/bgmobile.jpg";
import logo from "../../assets/logo.png";
import SmartRunLogo from "../../assets/SmartRun.png";
import valeo from "../../assets/valeo.png";
import Loader from "../../Utills/Loader";

const { Text, Title } = Typography;

const mapStateToProps = ({ user, settings }) => ({
  user,
  authProvider: settings.authProvider,
  logo: settings.logo,
});

const Login = () => {
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const externalAppUrl = `http://${window.location.hostname}:3002`;

  useEffect(() => {
    startRedirect();
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startRedirect = () => {
    setRedirecting(true);
    
    setTimeout(() => {
      window.location.replace(externalAppUrl);
    }, 5000);
  };

  const handleManualRedirect = () => {
    setRedirecting(true);
    window.location.replace(externalAppUrl);
  };

 
  if (redirecting && countdown === 0) {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
        <Loader />
        <Title level={4} className="mt-3">
          Redirecting to external application...
        </Title>
        <Text type="secondary">Please wait</Text>
      </div>
    );
  }

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
          <img
            src={SmartRunLogo}
            alt="Smartrun Logo"
            style={{
              width: 180,
              height: "100%",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
        </div>
      </nav>

      {/* ✅ Body - Centered with smaller card */}
      <div className="d-flex justify-content-center align-items-center flex-grow-1 p-3">
        <div
          className="card shadow-lg p-4"
          style={{ 
            maxWidth: "450px", 
            width: "100%", 
            borderRadius: "12px",
            margin: "0 auto" 
          }}
        >
          {/* Logo */}
          <div className="d-flex justify-content-center align-items-center mb-4">
            <img
              src={valeo}
              alt="Valeo Logo"
              style={{
                width: 120,
                height: "100%",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* External Redirect Content */}
          <div className="text-center">
            <Title level={4} className="mb-3">
              External Application Redirect
            </Title>
            
            {redirecting ? (
              <>
                <Loader />
                <div className="my-4">
                  <Title level={5} className="mb-2">
                    Redirecting in {countdown} seconds...
                  </Title>
                  <Text type="secondary">
                    Please wait while we redirect you
                  </Text>
                </div>
              </>
            ) : (
              <>
                <div className="my-4">
                  <Title level={5} className="mb-2">
                    You are being redirected to an external application
                  </Title>
                  <Text type="secondary">
                    Auto-redirect will start in {countdown} seconds
                  </Text>
                </div>
              </>
            )}

            <div className="mb-4 p-3 bg-light rounded">
              <Text strong>Destination:</Text>
              <br />
              <Text code className="text-break" style={{ fontSize: "0.9em" }}>
                {externalAppUrl}
              </Text>
            </div>

            {/* Action Button - Single button only */}
            <div className="mb-4">
              <Button
                type="primary"
                size="large"
                block
                onClick={handleManualRedirect}
                loading={redirecting}
              >
                <strong>Redirect Now</strong>
              </Button>
            </div>

            <div className="text-center mt-3">
              <Text type="secondary" style={{ fontSize: "0.9em" }}>
                If you are not redirected automatically, click the "Redirect Now" button.
              </Text>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-top">
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
              style={{ fontSize: "0.9em" }}
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
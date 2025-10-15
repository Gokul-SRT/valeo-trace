import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";
import "./Utills/agGridModules";
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
    <ToastContainer style={{marginTop:'65px'}} position="top-right" autoClose={3000} />
  </Provider>
);

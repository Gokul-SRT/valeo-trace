import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ProductMaster from "../ProductMaster/index";
import LineMaster from "../LineMaster/index";
import ChildPartMaster from "../ChildPartMaster";
import OperationMaster from "../OperationMaster";
import ChildPartOperationMap from "../ChildPartToOperationMaster";
import PacketQtyMaster from "../PacketQtyMaster/PacketQtyMaster";
import TypeMaster from "../TypeMaster/TypeMaster";
import ChildPartToTypeMasterMapping from "../ChildPartToTypeMasterMapping/ChildPartToTypeMasterMapping";
import ProductChildPartGrid from "../ProductToChildpartMap";
import CycleTimeMaster from "../CycleTimeMaster/CycleTimeMaster";
import GatewayMaster from "../../Master/GatewayMaster";
import VendorMaster from "../../Master/VendorMaster";
import ChildPartToVendorMapping from "../ChildPartToVendorMapping";
import { Select } from "antd";

const Traceability = () => {
  const [selectedScreen, setSelectedScreen] = useState("");
  const [submittedScreen, setSubmittedScreen] = useState("");

  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    if (!match) return null;

    const value = decodeURIComponent(match[2]);

    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }

  const traceabilityMaster = getCookie("traceabilityMaster");

  const screenComponentMap = {
    ProductMaster,
    LineMaster,
    ChildPartMaster,
    OperationMaster,
    ChildPartOperationMap,
    PacketQtyMaster,
    TypeMaster,
    ChildPartToTypeMasterMapping,
    ProductChildPartGrid,
    CycleTimeMaster,
    GatewayMaster,
    VendorMaster,
    ChildPartToVendorMapping,
  };

  const moduleScreens = Array.isArray(traceabilityMaster)
    ? [...traceabilityMaster]
        .sort((a, b) => a.s - b.s)
        .map((item) => ({
          id: item.s,
          name: item.d,
          value: screenComponentMap[item.l] || null,
        }))
    : [];
  const getComponentByScreenName = (screenName) => {
    const allScreens = Object.values(moduleScreens).flat();
    const screenItem = allScreens.find((item) => item.name === screenName);
    return screenItem ? screenItem.value : null;
  };

  const SelectedComponent = getComponentByScreenName(submittedScreen);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedScreen) {
      alert("Please select a screen first!");
      return;
    }

    const component = getComponentByScreenName(selectedScreen);
    if (!component) {
      alert("This screen component is not available yet!");
      return;
    }

    setSubmittedScreen(selectedScreen);
  };

  const handleCancel = () => {
    setSelectedScreen("");
    setSubmittedScreen("");
  };

  return (
    <div>
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Traceability Master
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Screens
                </label>
                <Select
                  placeholder="Select Masters"
                  value={selectedScreen || undefined}
                  onChange={setSelectedScreen}
                  style={{ width: "100%" }}
                  size="large"
                >
                  {Object.values(moduleScreens)
                    .flat()
                    .map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="submit"
                className="btn text-white me-2"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn text-white"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {SelectedComponent && submittedScreen && (
        <div className="mt-4">
          <SelectedComponent
            modulesprop="Traceability"
            screensprop={submittedScreen}
          />
        </div>
      )}
    </div>
  );
};

export default Traceability;

import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ToolMaster from "../ToolMaster";
import SparepartsMaster from "../SparepartsMaster";
import PMChecklistMaster from "../PMchecklistMaster";
import CustomerMaster from "../CustomerMaster";
//import SupplierMaster from "../SupplierMaster";
//import LocationMaster from "../LocationMaster";

const ToolMonitoring = () => {
  const [selectedScreen, setSelectedScreen] = useState("");
  const [submittedScreen, setSubmittedScreen] = useState("");

  const moduleScreens = {
    "ToolMonitoring": [
      { id: 1, name: "Tool Master", value: ToolMaster },
      { id: 2, name: "Spare Master", value: SparepartsMaster },
      { id: 3, name: "PM Checklist Master", value: PMChecklistMaster },
      { id: 4, name: "Customer Master", value: CustomerMaster },
      // { id: 5, name: "Supplier Master", value: SupplierMaster },
      // { id: 6, name: "Location Master", value: LocationMaster },
    ],
  };

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
    <div className="container mt-1">
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Tool Monitoring Master
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Screens
                </label>
                <select
                  className="form-select"
                  value={selectedScreen}
                  onChange={(e) => setSelectedScreen(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {Object.values(moduleScreens)
                    .flat()
                    .map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                </select>
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
            modulesprop="ToolMonitoring"
            screensprop={submittedScreen} 
          />
        </div>
      )}
    </div>
  );
};

export default ToolMonitoring;
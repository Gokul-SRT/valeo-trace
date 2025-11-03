import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ProductMaster from '../ProductMaster/index'
import LineMaster from '../LineMaster/index'
import ChildPartMaster from "../ChildPartMaster";
import OperationMaster from "../OperationMaster";
import ChildPartOperationMap from "../ChildPartToOperationMaster";
import PacketQtyMaster from "../PacketQtyMaster/PacketQtyMaster";
import TypeMaster from "../TypeMaster/TypeMaster";
import ChildPartToTypeMasterMapping from "../ChildPartToTypeMasterMapping/ChildPartToTypeMasterMapping";
import ProductChildPartGrid from "../ProductToChildpartMap";

const Traceability = () => {
  const [selectedScreen, setSelectedScreen] = useState("");
  const [submittedScreen, setSubmittedScreen] = useState("");

  const moduleScreens = {
    "Traceability": [
      { id: 1, name: "Product Master", value: ProductMaster },
      { id: 2, name: "Line Master", value: LineMaster },
      { id: 3, name: "Program Master", value: null },
      { id: 4, name: "Child Part Master", value: ChildPartMaster },
      { id: 5, name: "Operation Master", value: OperationMaster },
      { id: 6, name: "Operation Master To Child Master Mapping", value: ChildPartOperationMap },
      { id: 7, name: "Packet Qty Master", value: PacketQtyMaster },
      { id: 8, name: "Type Master", value: TypeMaster },
      { id: 9, name: "Child Part To Type Master Mapping", value: ChildPartToTypeMasterMapping },
      { id: 9, name: "Product To Child Part Mapping", value: ProductChildPartGrid },
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
          Traceability Master
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
            modulesprop="Traceability"
            screensprop={submittedScreen} 
          />
        </div>
      )}
    </div>
  );
};

export default Traceability;
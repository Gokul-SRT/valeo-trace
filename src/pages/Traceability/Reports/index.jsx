import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";

export default function TraceabilityReport() {
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [showExtraCard, setShowExtraCard] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [newRow, setNewRow] = useState({
    code: "",
    name: "",
    uom: "",
    category: "",
  });

  // ✅ Config-driven data
  const moduleScreens = {
    Traceability: [
      { id: 1, name: "Traceability Report" },
      { id: 2, name: "Reverse Traceability Report" },
    ],
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    { headerName: "Product Code", field: "code" },
    { headerName: "Product Description", field: "name" },
    { headerName: "Product UOM Code", field: "uom" },
    { headerName: "Product Category Code", field: "category" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedScreen) {
      alert("Please select the Screen!");
      return;
    }

    setIsSubmitted(true);

    if (selectedScreen === "SPC X-bar Chart Report") {
      setMasterList([]);
      return;
    }

    if (selectedScreen) {
      setMasterList([
        {
          code: "1PM-H1450-10",
          name: "1PM-H1450-10.Adhesive_1",
          uom: "U0001",
          category: "CI",
        },
        {
          code: "1PM-H1450-10.Adhesive_2",
          name: "1PM-H1450-10.Adhesive_2",
          uom: "U0001",
          category: "FG",
        },
        {
          code: "1PM-H1450-10.Balancing_Machine",
          name: "1PM-H1450-10.Balancing_Machine",
          uom: "U0001",
          category: "CI",
        },
      ]);
    }

    setShowExtraCard(false);
  };

  // ✅ Cancel
  const handleCancel = () => {
    setSelectedScreen("");
    setMasterList([]);
    setShowExtraCard(false);
    setIsSubmitted(false);
  };

  // ✅ Add new row
  const handleNewRowChange = (e) => {
    const { name, value } = e.target;
    setNewRow({ ...newRow, [name]: value });
  };

  const handleInsertRow = (e) => {
    e.preventDefault();
    if (newRow.code && newRow.name && newRow.uom && newRow.category) {
      setMasterList([...masterList, newRow]);
      setNewRow({ code: "", name: "", uom: "", category: "" });
      setShowExtraCard(false);
    } else {
      alert("Please fill all fields!");
    }
  };

  return (
    <div className="container mt-1">
      {/* First Card */}
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Reports
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={() => setShowExtraCard(true)}
            title="Add Master"
          />
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-center">
              {/* Module Dropdown */}
              {/* <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Module
                </label>
                <select
                  className="form-select"
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setSelectedScreen("");
                  }}
                  required
                >
                  <option value="">Select</option>
                  {Object.keys(moduleScreens).map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </div> */}

              {/* Screens Dropdown */}
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
                  {moduleScreens["Traceability"].map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
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

      {/* Second Card - Show Chart or Table only after Submit */}
      {isSubmitted && masterList.length > 0 && (
        <div className="mt-5">
          <div className="card shadow" style={{ borderRadius: "6px" }}>
            <div
              className="card-header text-white fw-bold"
              style={{ backgroundColor: "#00264d" }}
            >
              {selectedScreen} Details
            </div>
            <div className="card-body p-3">
              <AgGridReact
                rowData={masterList}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                paginationPageSize={10}
                pagination={true}
                domLayout="autoHeight"
                singleClickEdit={true}
                onCellValueChanged={(params) => {
                  const updatedList = [...masterList];
                  updatedList[params.rowIndex] = params.data;
                  setMasterList(updatedList);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showExtraCard && (
        <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
          <div
            className="card-header text-white fw-bold"
            style={{ backgroundColor: "#00264d" }}
          >
            Add New Product
          </div>
          <div className="card-body">
            <form onSubmit={handleInsertRow}>
              <div className="row g-3">
                {["code", "name", "uom", "category"].map((field, i) => (
                  <div className="col-md-3" key={i}>
                    <label className="form-label">
                      {field === "code"
                        ? "Product Code"
                        : field === "name"
                        ? "Product Description"
                        : field === "uom"
                        ? "UOM Code"
                        : "Category Code"}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={newRow[field]}
                      onChange={handleNewRowChange}
                      className="form-control"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="btn text-white me-2"
                  style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtraCard(false)}
                  className="btn btn-secondary"
                  style={{ minWidth: "90px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

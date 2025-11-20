import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import TraceabilityReport from "../../TraceabilityReport/TraceabilityReport";
import ReverseTraceabilityReport from "../../TraceabilityReport/ReverseTraceabilityReport"


const ReportModules = () => {
  const [selectedReport, setSelectedReport] = useState("");
  const [submittedReport, setSubmittedReport] = useState("");

  
  const reportScreens = {
    "ReportModules" :[
    { id: 1, name: "Traceability Report", component: TraceabilityReport },
    { id: 2, name: "Reverse Traceability Report", component: ReverseTraceabilityReport },
    
  ]
};

  
  const getComponentByName = (name) => {
     const allScreens = Object.values(reportScreens).flat();
    const found = allScreens.find((r) => r.name === name);
    return found ? found.component : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReport) {
      alert("Please select a report first!");
      return;
    }
    const comp = getComponentByName(selectedReport);
    if (!comp) {
      alert("This report component is not available yet!");
      return;
    }
    setSubmittedReport(selectedReport);
  };

  const handleCancel = () => {
    setSelectedReport("");
    setSubmittedReport("");
  };

  const SelectedReportComponent = getComponentByName(submittedReport);

  return (
    <div>
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Reports
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Select Report
                </label>
                <select
                  className="form-select"
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {reportScreens.ReportModules.map((item) => (
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

      {SelectedReportComponent && submittedReport && (
        <div className="mt-4">
          <SelectedReportComponent 
            modulesprop="ReportModules"
            screensprop={submittedReport}
          />
        </div>
      )}
    </div>
  );
};

export default ReportModules;

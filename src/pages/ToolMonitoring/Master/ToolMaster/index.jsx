import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const ToolMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      const sampleData = [
        {
          tool_id: "T001",
          tool_desc: "Greasing Fixture",
          max_shot_count: 50000,
          line: "Cover Assembly",
          machine: "Machine-A",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T002",
          tool_desc: "1st Top Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-B",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T003",
          tool_desc: "1st Bottom Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-B",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T004",
          tool_desc: "2nd Top Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-C",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T005",
          tool_desc: "2nd Bottom Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-C",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T006",
          tool_desc: "3rd Top Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-D",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T007",
          tool_desc: "3rd Bottom Tool",
          max_shot_count: 80000,
          line: "Cover Assembly",
          machine: "Machine-D",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T008",
          tool_desc: "Balancing Fixture",
          max_shot_count: 60000,
          line: "Cover Assembly",
          machine: "Machine-E",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T009",
          tool_desc: "Balancing Riveting Fixture",
          max_shot_count: 60000,
          line: "Cover Assembly",
          machine: "Machine-E",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T010",
          tool_desc: "Rebalancing Fixture",
          max_shot_count: 60000,
          line: "Cover Assembly",
          machine: "Machine-E",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T011",
          tool_desc: "R/o Depositor",
          max_shot_count: 70000,
          line: "Cover Assembly",
          machine: "Machine-F",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T012",
          tool_desc: "R/o Lever",
          max_shot_count: 70000,
          line: "Cover Assembly",
          machine: "Machine-F",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T013",
          tool_desc: "R/o Bunk",
          max_shot_count: 70000,
          line: "Cover Assembly",
          machine: "Machine-F",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T014",
          tool_desc: "R/o Probe",
          max_shot_count: 70000,
          line: "Cover Assembly",
          machine: "Machine-F",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T015",
          tool_desc: "R/o Po Plate",
          max_shot_count: 70000,
          line: "Cover Assembly",
          machine: "Machine-F",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T016",
          tool_desc: "EOL Bunk",
          max_shot_count: 90000,
          line: "Cover Assembly",
          machine: "Machine-G",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T017",
          tool_desc: "EOL Top Plate",
          max_shot_count: 90000,
          line: "Cover Assembly",
          machine: "Machine-G",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T018",
          tool_desc: "EOL Bottom Plate",
          max_shot_count: 90000,
          line: "Cover Assembly",
          machine: "Machine-G",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
        {
          tool_id: "T019",
          tool_desc: "EOL Po Plate",
          max_shot_count: 90000,
          line: "Cover Assembly",
          machine: "Machine-G",
          customer: "Maruthi",
          status: "Inactive",
          isActive: false,
          isLocked: false,
        },
        {
          tool_id: "T020",
          tool_desc: "EOL Marking Fixture",
          max_shot_count: 90000,
          line: "Cover Assembly",
          machine: "Machine-G",
          customer: "Maruthi",
          status: "Active",
          isActive: true,
          isLocked: false,
        },
      ];

      setMasterList(sampleData);
      setOriginalList(sampleData);
    }
  }, [modulesprop, screensprop]);

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const lineOptions = ["Cover Assembly", "Disc Assembly - 1", "Disc Assembly - 2"];
  const machineOptions = ["Machine-A", "Machine-B", "Machine-C"];
  const customerOptions = ["Maruthi"];

  const columnDefs = [
    { headerName: "Tool ID", field: "tool_id", filter: "agTextColumnFilter" },
    { headerName: "Tool Desc", field: "tool_desc", filter: "agTextColumnFilter" },
    {
      headerName: "Maximum Shot Count (Nos.)",
      field: "max_shot_count",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Line",
      field: "line",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: lineOptions },
      filter: "agSetColumnFilter",
    },
    {
      headerName: "Machine",
      field: "machine",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: machineOptions },
      filter: "agSetColumnFilter",
    },
    {
      headerName: "Customer",
      field: "customer",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: customerOptions },
      filter: "agSetColumnFilter",
    },
    {
      headerName: "Status",
      field: "status",
      filter: "agTextColumnFilter",
      editable: false,
    },
    {
      headerName: "Is Active",
      field: "isActive",
      filter: true,
      editable: (params) => !params.data?.isLocked, // disable edit when locked
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.isActive === true,
      valueSetter: (params) => {
        params.data.isActive = params.newValue ? true : false;
        params.data.status = params.newValue ? "Active" : "Inactive";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      tool_id: "",
      tool_desc: "",
      max_shot_count: "",
      line: "",
      machine: "",
      customer: "",
      status: "Active",
      isActive: true,
      isLocked: true, // prevent unchecking
    };
    const updated = [...masterList, emptyRow];
    setMasterList(updated);
    setOriginalList(updated);
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
  };

  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => item.isActive === true));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => item.isActive === false));
    }

    if (value === "Cover Assembly" || value === "Disc Assembly - 1" || value === "Disc Assembly - 2") {
      setMasterList(originalList.filter((item) => item.line === value));
    }
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `ToolMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1" style={{ padding: "0px" }}>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Tool Master
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Line</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Cover Assembly">Cover Assembly</option>
                <option value="Disc Assembly - 1">Disc Assembly - 1</option>
                <option value="Disc Assembly - 2">Disc Assembly - 2</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-3">
          {masterList.length > 0 && (
            <AgGridReact
              ref={gridRef}
              rowData={masterList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={10}
              pagination={true}
              domLayout="autoHeight"
              singleClickEdit={true}
              onFirstDataRendered={autoSizeAllColumns}
            />
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => onExportExcel(gridRef)}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Excel
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Update
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
        </div>
      </div>
    </div>
  );
};

export default ToolMaster;

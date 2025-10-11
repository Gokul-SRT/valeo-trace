import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const ToolMaster = ({ modulesprop, screensprop }) => {
  console.log("Modules Props:", modulesprop);
  console.log("Screens Props:", screensprop);

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
      // Sample data for Tool Master
      const sampleData = [
        {
          tool_id: "T001",
          tool_desc: "Press Die for Panel A",
          tool_type: "Press Die",
          max_shot_count: 50000,
          line: "Line-1",
          machine: "Machine-A",
          customer: "Toyota",
          location: "Plant 1",
          status: "Active",
          isActive: true,
        },
        {
          tool_id: "T002",
          tool_desc: "Injection Mold for Handle",
          tool_type: "Mold",
          max_shot_count: 80000,
          line: "Line-2",
          machine: "Machine-B",
          customer: "Honda",
          location: "Plant 2",
          status: "Inactive",
          isActive: false,
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

  const columnDefs = [
    { headerName: "Tool ID", field: "tool_id", filter: "agTextColumnFilter" },
    { headerName: "Tool Desc", field: "tool_desc", filter: "agTextColumnFilter" },
    { headerName: "Tool Type", field: "tool_type", filter: "agTextColumnFilter" },
    {
      headerName: "Maximum Shot Count",
      field: "max_shot_count",
      filter: "agNumberColumnFilter",
    },
    { headerName: "Line", field: "line", filter: "agTextColumnFilter" },
    { headerName: "Machine", field: "machine", filter: "agTextColumnFilter" },
    { headerName: "Customer", field: "customer", filter: "agTextColumnFilter" },
    { headerName: "Location", field: "location", filter: "agTextColumnFilter" },
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
      editable: true,
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
    const emptyRow = {};
    columnDefs.forEach((col) => {
      emptyRow[col.field] =
        col.field === "isActive"
          ? false
          : col.field === "status"
          ? "Inactive"
          : "";
    });
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
    <div className="container mt-1">
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
              <label className="form-label fw-bold">Search Filter</label>
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
              paginationPageSize={100}
              pagination={true}
              domLayout="autoHeight"
              singleClickEdit={true}
              onFirstDataRendered={autoSizeAllColumns}
              onCellValueChanged={(params) => {
                const updatedList = [...masterList];
                updatedList[params.rowIndex] = params.data;
                setMasterList(updatedList);
                setOriginalList(updatedList);
              }}
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

import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const PMChecklistMaster = ({ modulesprop, screensprop }) => {
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
      // Sample data for PM Checklist Master
      const sampleData = [
        {
          sno: 1,
          characteristic: "CHECK THE GREASING PIN DIA(#20)",
          spec_unit: "10.5+0.10MM",
          measurement_tools: "VERNIER",
          status: "Active",
          isActive: true,
        },
        {
          sno: 2,
          characteristic: "TOP TOOL CAM/BASE MOVEMENT CHECKED",
          spec_unit: "51+0.50MM",
          measurement_tools: "VERNIER",
          status: "Inactive",
          isActive: false,
        },
        {
          sno: 2,
          characteristic: "CHECK THE TOP TOOL CAM SPRING LENGTH",
          spec_unit: "40.0+0.20MM",
          measurement_tools: "VERNIER",
          status: "Active",
          isActive: true,
        },
        {
          sno: 2,
          characteristic: "CHECK THE TOP TOOL SUPPORTING STOPPER LENGTH",
          spec_unit: "38+0.50MM",
          measurement_tools: "VERNIER",
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
    { headerName: "S.NO", field: "sno", filter: "agNumberColumnFilter" },
    {
      headerName: "Characteristic",
      field: "characteristic",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "SPEC/UNIT",
      field: "spec_unit",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Measurement Tools",
      field: "measurement_tools",
      filter: "agTextColumnFilter",
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
          : col.field === "sno"
          ? masterList.length + 1
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
        fileName: `PMChecklistMaster.xlsx`,
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
          PM Checklist Master
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

export default PMChecklistMaster;

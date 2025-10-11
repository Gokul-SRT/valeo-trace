import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const SparepartsMaster = ({ modulesprop, screensprop }) => {
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
      // Sample data for Spareparts Master
      const sampleData = [
        {
          spare_part_no: "S0001",
          description: "Die Finger",
          min_qty: "2",
          line: "Cover Assembly",
          tool_assoc: "Die-A",
          supplier: "ABC Ltd",
          location: "Bin-01",
          status: "Active",
          isActive: true,
        },
        {
          spare_part_no: "S0002",
          description: "Bearing",
          min_qty: "5",
          line: "Disc Assembly 1",
          tool_assoc: "Die-B",
          supplier: "XYZ Ltd",
          location: "Bin-02",
          status: "Inactive",
          isActive: false,
        },
        {
          spare_part_no: "S0003",
          description: "Bolt Set",
          min_qty: "10",
          line: "Disc Assembly 2",
          tool_assoc: "Die-C",
          supplier: "LMN Ltd",
          location: "Bin-03",
          status: "Active",
          isActive: true,
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
    { headerName: "Spare Part No", field: "spare_part_no", filter: "agTextColumnFilter" },
    { headerName: "Description", field: "description", filter: "agTextColumnFilter" },
    { headerName: "Min Qty", field: "min_qty", filter: "agTextColumnFilter" },
    { headerName: "Line", field: "line", filter: "agTextColumnFilter" },
    { headerName: "Tool Assoc", field: "tool_assoc", filter: "agTextColumnFilter" },
    { headerName: "Supplier", field: "supplier", filter: "agTextColumnFilter" },
    { headerName: "Location", field: "location", filter: "agTextColumnFilter" },
    {
      headerName: "Status",
      field: "status",
      editable: false,
      filter: "agTextColumnFilter",
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
    if (!value) {
      setMasterList(originalList);
    } else {
      setMasterList(
        originalList.filter(
          (item) => item.line.toLowerCase() === value.toLowerCase()
        )
      );
    }
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `SparepartsMaster.xlsx`,
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
          Spareparts Master
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
                defaultValue=""
              >
                <option value="">Select Line</option>
                <option value="Cover Assembly">Cover Assembly</option>
                <option value="Disc Assembly 1">Disc Assembly 1</option>
                <option value="Disc Assembly 2">Disc Assembly 2</option>
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

export default SparepartsMaster;

import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);

const OperationMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
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
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
    if (selectedModule && selectedScreen) {
      const sampleData = [
  {
    operationId: 1,  
    operationCode: "CF72760",
    operationDesc: "Cushion Disc - MSIL Z12E 200 UX OE",
    productId: "MSIL Z12E 200 OE",
    lineId: "Disc Assy",
    createdAt: "26-09-2025 10:00",
    updatedAt: "29-09-2025 13:00",
    status: true,
  },
  {
    operationId: 2,
    operationCode: "CF72760HF",
    operationDesc: "Cushion Disc HF - MSIL  Z12E 200 UX OE",
    productId: "MSIL Z12E 200 OE",
    lineId: "Disc Assy",
    createdAt: "26-09-2025 10:00",
    updatedAt: "29-09-2025 00:00",
    status: true,
  },
  {
    operationId: 3,
    operationCode: "CF72760TE",
    operationDesc: "Cushion Disc Temp - MSIL  Z12E 200 UX OE",
    productId: "MSIL Z12E 200 OE",
    lineId: "Disc Assy",
    createdAt: "26-09-2025 08:00",
    updatedAt: "29-09-2025 19:00",
    status: false,
  },
  {
    operationId: 4,
    operationCode: "CF89045HP",
    operationDesc: "Cover Plate Forming - MSIL Z12E 200CPoV",
    productId: "MSIL YTZ 300 OE",
    lineId: "Cover Assy",
    createdAt: "26-09-2025 07:00",
    updatedAt: "29-09-2025 14:30",
    status: true,
  },
  {
    operationId: 5,
    operationCode: "CF89045BL",
    operationDesc: "Cover Blank - MSIL Z12E 200CPoV",
    productId: "MSIL YTZ 300 OE",
    lineId: "Cover Assy",
    createdAt: "26-09-2025 06:00",
    updatedAt: "26-09-2025 20:00",
    status: true,
  }
];
      setMasterList(sampleData);
      setOriginalList(sampleData);
    }
  }, [selectedModule, selectedScreen]);

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
     {
      headerName: "OperationId",
      field: "operationId",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Operation Code",
      field: "operationCode",
      filter: "agTextColumnFilter",
      editable: (params) => !params.data || !params.data.operationCode, 
    },
    {
      headerName: "Operation Description",
      field: "operationDesc",
      filter: "agTextColumnFilter",
    },
     {
      headerName: "Product Id",
      field: "productId",
      filter: "agTextColumnFilter",
    },
     {
      headerName: "Line Id",
      field: "lineId",
      filter: "agTextColumnFilter",
    },
     {
      headerName: "Created At",
      field: "createdAt",
      filter: "agTextColumnFilter",
    },
     {
      headerName: "Updated At",
      field: "updatedAt",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === true,
      valueSetter: (params) => {
        params.data.status = params.newValue ? true : false;
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // Add new empty row
  const handleAddRow = () => {
    const nextId =
    masterList.length > 0
      ? Math.max(...masterList.map((item) => Number(item.id) || 0)) + 1
      : 1;

  // Create an empty row with that ID
  const emptyRow = { id: nextId };
  columnDefs.forEach((col) => {
    if (col.field !== "id") {
      emptyRow[col.field] = "";
    }
  });
    emptyRow.status = false; // default inactive
    const updated = [...masterList, emptyRow];
    setMasterList(updated);
    setOriginalList(updated);
  };

  // Cancel
  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
  };

  // Filter change
  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => item.status === true));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => item.status === false));
    }
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `OperationMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1">
      {masterList.length > 0 && (
        <div
          className="card shadow mt-4"
          style={{ borderRadius: "6px" }}
        >
          <div
            className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "#00264d" }}
          >
            {selectedScreen} Details
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
      )}
    </div>
  );
};

export default OperationMaster;

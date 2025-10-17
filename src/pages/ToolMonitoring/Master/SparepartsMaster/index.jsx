import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const criticalSparesList = [
  { description: "Locating pin" },
  { description: "Cover Locating Pin" },
  { description: "POKA-YOKE BUSH" },
  { description: "Hook Rivet Guide pin" },
  { description: "Hook Rivet Guide pin spring" },
  { description: "Hook Rivet Punch with MAGNET" },
  { description: "Delta Rivet Holder" },
  { description: "DSP Loader" },
  { description: "Bottom stopper" },
  { description: "Top Punch 80.0 mm" },
  { description: "Top Punch 80.30 mm" },
  { description: "Top Load Spring" },
  { description: "TOP Punch Base Plate" },
  { description: "Top Tool Holder Spring" },
  { description: "Cover Plate Holder Bush" },
  { description: "Hook Rivet Plate" },
  { description: "DSP Locator Pin" },
  { description: "DSP Holder pin spring" },
  { description: "Drive Strap Pin" },
  { description: "Bottom Punch Spacer" },
];

const SparepartsMaster = ({ modulesprop, screensprop }) => {
  const [masterList, setMasterList] = useState([]);
  const gridRef = useRef(null);

  // Auto-size all columns
  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  // Load default spares list
  useEffect(() => {
    const generatedData = criticalSparesList.map((item, index) => ({
      spare_part_no: `S${(index + 1).toString().padStart(4, "0")}`,
      description: item.description,
      min_qty: Math.floor(Math.random() * 8) + 3, // random 3–10
      status: "Active",
      isActive: true,
    }));
    setMasterList(generatedData);
  }, []);

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    { headerName: "Spare Part No", field: "spare_part_no", filter: "agTextColumnFilter" },
    { headerName: "Description", field: "description", filter: "agTextColumnFilter" },
    {
      headerName: "Min Qty",
      field: "min_qty",
      filter: "agTextColumnFilter",
      editable: true,
      cellStyle: { textAlign: "center" },
    },
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

  // Add new empty row
  const handleAddRow = () => {
    const newRow = {
      spare_part_no: `S${(masterList.length + 1)
        .toString()
        .padStart(4, "0")}`,
      description: "",
      min_qty: 3,
      status: "Active",
      isActive: true,
    };
    const updated = [...masterList, newRow];
    setMasterList(updated);
  };

  // Export to Excel
  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `SparepartsMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  const handleCancel = () => {
    const regenerated = criticalSparesList.map((item, index) => ({
      spare_part_no: `S${(index + 1).toString().padStart(4, "0")}`,
      description: item.description,
      min_qty: Math.floor(Math.random() * 8) + 3,
      status: "Active",
      isActive: true,
    }));
    setMasterList(regenerated);
  };

  return (
    <div className="container mt-1 p-0">
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
              onCellValueChanged={(params) => {
                const updatedList = [...masterList];
                updatedList[params.rowIndex] = params.data;
                setMasterList(updatedList);
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

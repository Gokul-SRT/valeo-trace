import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";
import { ExcelExportModule } from "ag-grid-enterprise";
import "ag-grid-enterprise";
ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

const autoSizeAllColumns = (params) => {
  if (!params.columnApi || !params.columnApi.getAllColumns) return;

  const allColumnIds = params.columnApi
    .getAllColumns()
    .map((col) => col.getId());
  params.api.autoSizeColumns(allColumnIds);
};

const ProductChildPartMapp = () => {
  // const[rowData, setrowData] = useState([])
  // const[columnDefs, setcolumnDefs] = useState([])
  const RowListData = [
    { id: 1, product: "P001", childParts: ["CP001", "CP002"] },
    { id: 2, product: "P002", childParts: ["CP003"] },
  ]
  const columnDefs = [
    {
      headerName: "Product",
      field: "product",

    },
    {
      headerName: "Child Parts",
      field: "childParts",

    },
    {
      headerName: "Action",
      cellRenderer: (params) => (
        <button
          onClick={() => alert(`Edit ${params.data.product}`)}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
      ),
      flex: 1,
    },
  ];

  return (
    <div className="container mt-1 p-0">
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Product-Child Part Map Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={() => alert("Add new row clicked")}
            title="Add Row"
          />
        </div>

        {/* ✅ Add theme and height wrapper */}
        <div className="card-body p-3">

          <AgGridReact
            rowData={RowListData}
            columnDefs={columnDefs}
            defaultColDef={{
              flex: 1,
              minWidth: 100,
              resizable: true,
            }}
            pagination={true}
            paginationPageSize={10}
            domLayout="autoHeight"
            onFirstDataRendered={autoSizeAllColumns}
          />

        </div>
      </div>
    </div>
  );
};

export default ProductChildPartMapp;

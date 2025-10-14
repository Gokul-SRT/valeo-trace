import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";

const CustomerMaster = ({ modulesprop, screensprop }) => {
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
      const sampleData = [
        { customer_id: "CUST001", customer_name: "Maruti", status: "Active" },
      ].map((item) => ({
        ...item,
        isActive: item.status === "Active",
        isDisabled: false,
      }));

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

  // Custom renderer for handling disabled checkbox
  const CustomCheckboxRenderer = (props) => {
    const handleChange = (e) => {
      if (props.data.isDisabled) return;
      props.setValue(e.target.checked);
    };

    return (
      <input
        type="checkbox"
        checked={props.value}
        onChange={handleChange}
        disabled={props.data.isDisabled}
        style={{
          cursor: props.data.isDisabled ? "not-allowed" : "pointer",
        }}
      />
    );
  };

  const columnDefs = [
    {
      headerName: "Customer ID",
      field: "customer_id",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Customer Name",
      field: "customer_name",
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
      cellRenderer: CustomCheckboxRenderer,
      valueGetter: (params) => params.data.isActive === true,
      valueSetter: (params) => {
        params.data.isActive = params.newValue ? true : false;
        params.data.status = params.newValue ? "Active" : "Inactive";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // + Button Click
  const handleAddRow = () => {
    const newRow = {
      customer_id: "",
      customer_name: "",
      status: "Active",
      isActive: true,
      isDisabled: true, // Disable checkbox
    };
    const updated = [...masterList, newRow];
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
        fileName: `CustomerMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1 p-0">
      {/* Match size and alignment with Tool Monitoring Master */}
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card shadow mt-4">
            {/* Card Header */}
            <div
              className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
              style={{
                backgroundColor: "#00264d",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                padding: "10px 15px",
              }}
            >
              Customer Master
              <PlusOutlined
                style={{
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "white",
                }}
                onClick={handleAddRow}
                title="Add Row"
              />
            </div>

            {/* Card Body */}
            <div className="card-body p-3">
              {/* Filter Dropdown */}
              <div className="row mb-3">
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

              {/* Grid */}
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

              {/* Buttons */}
              <div className="text-center mt-4">
                <button
                  onClick={() => onExportExcel(gridRef)}
                  className="btn text-white me-2"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                >
                  Excel
                </button>
                <button
                  type="submit"
                  className="btn text-white me-2"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn text-white"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMaster;

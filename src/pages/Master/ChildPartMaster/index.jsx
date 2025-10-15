import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";
import { toast } from "react-toastify";
import serverApi from '../../../serverAPI';

ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);

const ChildPartMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const gridRef = useRef(null);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem('branchCode'));

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi.getAllColumns().map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
    if (selectedModule && selectedScreen) {
     fetchData()
    }
  }, [selectedModule, selectedScreen]);

   const fetchData = async () => {
      try {
        const response = await serverApi.post("getchildpartMasterdtl", {
          isActive: "1",
          tenantId,
          branchCode,
        });
        if (!response.data || response.data.length === 0) {
          setMasterList([]);
          setOriginalList([]);
         
        } else {
          const updatedResponseData = response.data.map((item) => ({
            ...item,
            isUpdate: 1,
          }));
          setMasterList(updatedResponseData);
          setOriginalList(updatedResponseData);
          console.log(updatedResponseData);
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
        toast.error("Error fetching data. Please try again later.");
      }
    };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    { headerName: "Id", field: "id", filter: "agNumberColumnFilter", editable: false },
    { headerName: "Child Part Code", field: "childPartCode", filter: "agTextColumnFilter" },
    { headerName: "Child Part Desc", field: "childPartDesc", filter: "agTextColumnFilter" },
    { headerName: "Product", field: "product", filter: "agTextColumnFilter" },
    { headerName: "Line", field: "line", filter: "agTextColumnFilter" },
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
        fileName: `ChildPartMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1">
      {masterList.length > 0 && (
        <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
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
                <select className="form-select" onChange={(e) => handleFilterChange(e.target.value)}>
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

export default ChildPartMaster;

import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";
import store from "store";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";

ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);

const OperationMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const gridRef = useRef(null);


  const tenantId = store.get("tenantId")
  const branchCode = store.get('branchCode');
  const employeeId = store.get("employeeId")

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
      fetchData()
    }
  }, [selectedModule, selectedScreen]);

  const fetchData = async (e) => {
      try {
        const response = await serverApi.post("getoperationMasterdtl", {
          isActive: e || "getAll",
          tenantId,
          branchCode,
        });
        if (response?.data?.responseCode === '200') {
          console.log(response)
          const updatedResponseData = response?.data?.responseData.map((item) => ({
            ...item,
            isUpdate: 1,
          }));
          setMasterList(updatedResponseData);
          setOriginalList(updatedResponseData);
        }else{
          setMasterList([]);
          setOriginalList([]);
          toast.error(response.data.responseMessage)
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
        toast.error("Error fetching data. Please try again later.");
      }
    };


    const createorUpdate = async () => {
    try {
      const updatedList = masterList.map(item => ({
        isUpdate: item.isUpdate,
        isActive: item.isActive,
        opId: item.operationId,
        opCode: item.operationUniquecode,
        opDesc: item.operationDesc,
        prodCnt: item.productionParameterCount,
        tenantId,
        updatedBy: employeeId,
        branchCode,
      }));

      const response = await serverApi.post("insertupdateoperationmaster", updatedList);

      if (response?.data?.responseCode === '200') {
        toast.success(response.data.responseMessage)
        fetchData();
      } else {
        toast.error(response.data.responseMessage)
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Error while saving data!");
    }
  }
  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
     {
      headerName: "Operation Id",
      field: "operationId",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Operation Code",
      field: "operationUniquecode",
      filter: "agTextColumnFilter",
      editable: (params) => !params.data || !params.data.operationCode, 
    },
    {
      headerName: "Operation Description",
      field: "operationDesc",
      filter: "agTextColumnFilter",
    },
     {
      headerName: "Production Parameter Count",
      field: "productionParameterCount",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Status",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.isActive === "1" || params.data.isActive === 1,
      valueSetter: (params) => {
        params.data.isActive = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // Add new empty row
  const handleAddRow = () => {
     const emptyRow = {
            isUpdate:0
          };
          const emptyRowss = masterList.filter((item)=> !item.operationId && !item.operationUniquecode);
      
            if(emptyRowss && emptyRowss?.length === 0){
              const updated = [...masterList, emptyRow];
              setMasterList(updated);
              setOriginalList(updated);
            }else{
            // ("Please enter the empty rows.");
            toast.error("Please enter the empty rows.");
            } 
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
      fetchData(value)
    } else if (value === "Active") {
      fetchData(1)
      // setMasterList(originalList.filter((item) => item.status === true));
    } else if (value === "Inactive") {
      fetchData("0")
      // setMasterList(originalList.filter((item) => item.status === false));
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
    <div className="container mt-1container mt-1 p-0">
      {/* {masterList.length > 0 && ( */}
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
                onClick={createorUpdate}
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
      {/* )} */}
    </div>
  );
};

export default OperationMaster;

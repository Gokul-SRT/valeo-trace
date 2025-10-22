import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";
import { ExcelExportModule } from "ag-grid-enterprise";
import { Input, Button, Form, message } from "antd";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

const LineMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [productData, setProductData] = useState([])
  const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
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
  }, [modulesprop, screensprop]);

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData();
      getProductDropDownData()
    }
  }, [selectedModule, selectedScreen]);
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("employeeId"));
  const fetchData = async () => {
    try {
      const response = await serverApi.post("getlineMasterdtl", {
        isActive: "getAll",
        tenantId: tenantId,
        branchCode: branchCode,
      });

      // ✅ Handle if backend sends null, undefined, or empty array
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
    //floatingFilter: true,
    editable: true,
    //resizable: true, // allow manual resize too
    flex: 1,
  };

  const getProductDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        // branchCode,
        isActive: "1",
      }
      const response = await serverApi.post("getProductDropdown", payload);

      let returnData = []; 

      if (response?.data?.responseCode === '200' && response.data.responseData) {
        // toast.success(response.data.responseMessage);
        returnData = response.data.responseData;
      } else {
        toast.error(response.data.responseMessage || "Failed to load Child Parts.");
      }
      const options = returnData.map(item => ({
        key: item.productCode || "",
        value: item.productCode || ""
      }));
      setProductData(options);
      return returnData;

    } catch (error) {
      console.error('Error fetching child part dropdown data:', error);
      toast.error('Error fetching data. Please try again later.');
      return [];
    }
  }

  const columnDefs = [
    {
      headerName: "Line Code",
      field: "lineMstCode",
      filter: "agTextColumnFilter",
      editable: (params) => (params.data.isUpdate === 0 ? true : false),
    },
    {
      headerName: "Line Description",
      field: "lineMstDesc",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      editable: true, 
      cellEditor: "agSelectCellEditor", 
      cellEditorParams: {
      values: productData.map(item => item.key), // Ag-Grid typically expects an array of keys for 'values'
    },
    valueFormatter: (params) => {
      // Find the corresponding display value (item.value) based on the stored key (params.value)
      const option = productData.find(item => item.key === params.value);
      return option ? option.value : params.value; // Display the value or the original code if not found
    },
    },
    {
      headerName: "IsActive",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",

      valueGetter: (params) =>
        params.data.isActive === "1" || params.data.isActive === 1,
      valueSetter: (params) => {
        // when checkbox is clicked, set 1 for true, 0 for false
        params.data.isActive = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const linecodeempty = masterList.filter((item) => !item.lineMstCode);
    console.log(linecodeempty);
    if (linecodeempty && linecodeempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      message.error("Please enter the Line code for all the rows.");
      toast.error("Please enter the Line code for all the rows.");
    }
  };

  const createorUpdate = async () => {
    try {
      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        lineMasterCode: item.lineMstCode,
        sequence: item.sequence || "0",
        lineMasterDesc: item.lineMstDesc,
        productCode: item.productCode,
        tenantId: tenantId,
        isActive: item.isActive,
        updatedBy: employeeId,
        branchCode: branchCode,
      }));

      const response = await serverApi.post("insertupdatelinemaster", updatedList);

      if (response.data && response.data === "SUCCESS") {
        toast.success("Data saved successfully!");
        fetchData();
      }  else if (response.data && response.data === "DUBLICATE") {
        toast.success("Do Not Allow Dublicate LineCode!");

      }  else {
        toast.error("SaveOrUpdate failed.");
        
      }
    } catch (error) {
      console.error("Error saving product data:", error);
       toast.error("Error while saving data!");
     
    }
  };

  // ✅ Cancel
  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  // ✅ Filter change
  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "1") {
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    } else if (value === "0") {
      setMasterList(originalList.filter((item) => item.isActive === "0"));
    }
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `LineMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1 p-0">
      {/* Second Card - Table */}
      {/* {masterList.length > 0 && ( */}
      <div className="card shadow" style={{ borderRadius: "6px" }}>
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

        {/* 🔹 Filter Dropdown */}
        <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Search Filter</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">InActive</option>
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
            paginationPageSize={10}
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

export default LineMaster;

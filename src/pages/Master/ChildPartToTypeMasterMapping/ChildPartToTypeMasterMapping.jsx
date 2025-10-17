 
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

const ChildPartToTypeMasterMapping = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
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
    }
  }, [selectedModule, selectedScreen]);
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("empID"));
  console.log("tenantId",tenantId);

  const fetchData = async () => {
    try {
      //  console.log(store.get('tenantId'),"tenantId");
      //  console.log(store.get('branchCode'),"branchCode");
      const response = await serverApi.post("getchildpartTypeMappingdtl", {
       
        tenantId:tenantId,
        branchCode:branchCode
        
        // tenantId: "val",
        // branchCode: "VAL",
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
    editable: true,
    //resizable: true, // allow manual resize too
    flex: 1,
  };

 

// const columnDefs = [
//   { headerName: "Packet ID", field: "packetId", filter: "agTextColumnFilter",  editable: (params) => (params.data.isUpdate === 0 ? true : false), },
//   { headerName: "Child Part ID", field: "childPartId", filter: "agTextColumnFilter" },
//   { headerName: "Packet Qty", field: "packetsQtys", filter: "agNumberColumnFilter" },
// ];



const columnDefs = [
  { headerName: "Child Map Id", field: "childPacMapId", filter: "agTextColumnFilter" ,editable: (params) => (params.data.isUpdate === 0 ? true : false), },
  { headerName: "Child Part Id", field: "childPartId", filter: "agTextColumnFilter" },
  { headerName: "Type Id", field: "typeId", filter: "agTextColumnFilter" },
  // { headerName: "Tenant ID", field: "tenant_id", filter: "agTextColumnFilter" },
  // { headerName: "Created At", field: "created_at", filter: "agDateColumnFilter" },
  // { headerName: "Updated At", field: "updated_at", filter: "agDateColumnFilter" },
  // {
  //   headerName: "Is Active",
  //   field: "isActive",
  //   filter: true,
  //   editable: true,
  //   cellRenderer: "agCheckboxCellRenderer",
  //   cellEditor: "agCheckboxCellEditor",
  //   valueGetter: (params) => params.data.isActive === true,
  //   valueSetter: (params) => {
  //     params.data.isActive = params.newValue ? true : false;
  //     return true;
  //   },
  //   cellStyle: { textAlign: "center" },
  // },
];

  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const ChildPartToTypeMasterempty = masterList.filter((item) => !item.childPacMapId);
    console.log(ChildPartToTypeMasterempty);
    if (ChildPartToTypeMasterempty && ChildPartToTypeMasterempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please enter the ChildMapId for all the rows.");
    }
  };

  const createorUpdate = async () => {
    try {
      console.log('masterList',masterList)
      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        childPacMapId: item.childPacMapId,
        childPartId: item.childPartId,
        typeId: item.typeId,
        tenantId: tenantId,
        udatedBy: employeeId,
        branchCode: branchCode,
      }));

      const response = await serverApi.post(
        "insertupdatechildparttypemapping",
        updatedList
      );

      if (response.data && response.data === "SUCCESS") {
        toast.success("Data saved successfully!");
        fetchData();
      } else if (response.data && response.data === "DUBLICATE") {
        toast.success("Do Not Allow Dublicate ChildMapId!");

      }  else {
        toast.error("SaveOrUpdate failed.");
        
      }
    } catch (error) {
      console.error("Error saving Child Part To Type Master data:", error);
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
        fileName: `ChildPartToTypeMaster.xlsx`,
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
        {/* <div className="p-3">
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
        </div> */}

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

export default ChildPartToTypeMasterMapping;

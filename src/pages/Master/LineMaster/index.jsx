import React, { useRef,useEffect,useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from 'ag-grid-community'; 
import { SetFilterModule } from 'ag-grid-enterprise'; 
import { DateFilterModule } from 'ag-grid-enterprise'; 

ModuleRegistry.registerModules([ SetFilterModule,
    DateFilterModule]); 

const LineMaster = ({modulesprop,screensprop}) => {
    const [selectedModule, setSelectedModule] = useState("");
    const [selectedScreen, setSelectedScreen] = useState("");
    const [masterList, setMasterList] = useState([]);
    const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
    const gridRef = useRef(null);
   
  
  
  
    
  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
  
    const allColumnIds = params.columnApi.getAllColumns().map(col => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };
  
  useEffect(() => {
      setSelectedModule(modulesprop);
      setSelectedScreen(screensprop);
      if (selectedModule && selectedScreen) {
        const sampleData = [
          {
            lineCode: "L0001",
            lineDesc: "Cover Line 1",
            isActive: true,
          },
          {
            lineCode: "L0002",
            lineDesc: "Disk Line 2",
            isActive: true,
          },
          {
            lineCode: "L0003",
            lineDesc: "Disk Line 2",
            isActive: false,
          },
        ];
        setMasterList(sampleData);
        setOriginalList(sampleData);
      }
    }, [selectedModule, selectedScreen]); 
  
  
  
    const defaultColDef = {
      sortable: true,
      filter: true,
      //floatingFilter: true,
      editable: true,
      //resizable: true, // allow manual resize too
       flex: 1,
    };
  
    const columnDefs = [
      {
          headerName: "Line Code",
          field: "lineCode",
          filter: "agTextColumnFilter",
          editable: (params) => !params.data || !params.data.lineCode, // only editable if code is empty
        },
      { headerName: "Line Description", field: "lineDesc",filter: "agTextColumnFilter" },
     
      {
          headerName: "IsActive",
          field: "isActive",
          filter: true,
          editable: true,
          cellRenderer: "agCheckboxCellRenderer",
          cellEditor: "agCheckboxCellEditor",
          valueGetter: (params) => params.data.isActive === true,
          valueSetter: (params) => {
            params.data.isActive = params.newValue ? true : false;
            return true;
          },
          cellStyle: { textAlign: "center" }
        }
      
    ];
  
  
  // Add new empty row
  const handleAddRow = () => {
      const emptyRow = {};
      columnDefs.forEach((col) => {
        emptyRow[col.field] = "";
      });
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    };
  
  
    // ✅ Cancel
    const handleCancel = () => {
      setSelectedModule("");
      setSelectedScreen("");
      setMasterList([]);
      setOriginalList([]);
     
    };
  
  
    // ✅ Filter change
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
          fileName: `ProductMaster.xlsx`,
        });
      } else {
        alert("Grid is not ready!");
      }
    };
  
    return (
      <div className="container mt-1">
        
  
        {/* Second Card - Table */}
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
                    <option value="Active">Active</option>
                    <option value="Inactive">InActive</option>
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
  }

export default LineMaster;
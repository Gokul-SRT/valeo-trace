import React, { useRef,useEffect,useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from 'ag-grid-community'; 
import { SetFilterModule } from 'ag-grid-enterprise'; 

ModuleRegistry.registerModules([ SetFilterModule ]); 

const EquipmentMaster = ({modulesprop,screensprop}) => {
    const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
  const gridRef = useRef(null);
 // const [showExtraCard, setShowExtraCard] = useState(false);

//   const [newRow, setNewRow] = useState({
//     code: "",
//     name: "",
//     uom: "",
//     category: "",
//     status: "Active",
//   });

  // ✅ Config-driven data
//   useEffect(() => {
//     // Only update state if prop has changed
//     if (modulesprop !== selectedModule) setSelectedModule(modulesprop);
//     if (screensprop !== selectedScreen) setSelectedScreen(screensprop);
//   }, [modulesprop, screensprop, selectedModule, selectedScreen]);

// useEffect(() => {
//     setSelectedModule(modulesprop);
//     setSelectedScreen(screensprop);
//   }, [modulesprop, screensprop]);


// 🔹 Static dropdown values
const categoryOptions = ["Category A", "Category B", "Category C"];
const typeOptions = ["Type A", "Type B", "Type C"];
const statusOptions = ["Idel", "Running","Stop"];
  
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
          code: "1PM-H1450-10",
          name: "1PM-H1450-10.Adhesive_1",
          uom: "U0001",
          category: "CI",
          categoryOptions:"Category A",
          type:"Type A",
          status:"Idel",
          isActive: true,
        },
        {
          code: "1PM-H1450-10.Adhesive_2",
          name: "1PM-H1450-10.Adhesive_2",
          uom: "U0001",
          category: "FG",
          categoryOptions:"Category A",
          type:"Type A",
          status:"Idel",
          isActive: false,
        },
        {
          code: "1PM-H1450-10.Balancing_Machine",
          name: "1PM-H1450-10.Balancing_Machine",
          uom: "U0001",
          category: "CI",
          categoryOptions:"Category A",
          type:"Type A",
          status:"Idel",
          isActive: true,
        },
      ];
      setMasterList(sampleData);
      setOriginalList(sampleData);
    }
  }, [selectedModule, selectedScreen]); 

//   const moduleScreens = {
//     "Production Monitoring": [
//       { id: 1, name: "Equipment Master" },
//       { id: 2, name: "Employee Master" },
//       { id: 3, name: "Reason Code Master" },
//       { id: 4, name: "Cycle Time Configuration" },
//       { id: 5, name: "Line / Station / Operation Mapping Master" },
//       { id: 6, name: "User Management Master" },
//       { id: 7, name: "Station - Product Cost Master" },
//       { id: 8, name: "SPC Report Characteristics Master" },
//       { id: 9, name: "Mail ID Master" },
//       { id: 10, name: "Equipment Status Master" },
//       { id: 11, name: "Traceability Parameter Threshold Config Master" },
//       { id: 12, name: "Traceability Sensor Meter Master" },
//       { id: 13, name: "Traceability Parameter Master" },
//       { id: 14, name: "Tenant Property Master" },
//       { id: 15, name: "User Screen Access Control Config" },
//     ],
//     Traceability: [
//       { id: 1, name: "Product Master" },
//       { id: 2, name: "Line Master" },
//       { id: 3, name: "Program Master" },
//       { id: 4, name: "Child Part Master" },
//       { id: 5, name: "Operation Master" },
//       { id: 6, name: "Operation Master To Child Master Mapping" },
//       { id: 7, name: "Packet Qty Master" },
//       { id: 8, name: "Type Master" },
//       { id: 9, name: "Child Part To Type Master Mapping" },
//     ],
//   };

  const defaultColDef = {
    sortable: true,
    filter: true,
    //floatingFilter: true,
    editable: true,
    resizable: true, // allow manual resize too
    // flex: 1,
  };

  const columnDefs = [
    {
        headerName: "Equipment Code",
        field: "code",
        filter: "agTextColumnFilter",
        editable: (params) => !params.data || !params.data.code, // only editable if code is empty
      },
    { headerName: "Product Description", field: "name",filter: "agTextColumnFilter" },
    { headerName: "Product UOM Code", field: "uom",filter: "agTextColumnFilter" },
    { headerName: "Product Category Code", field: "category",filter: "agTextColumnFilter" },
    // {
    //     headerName: "IsActive",
    //     field: "isActive",
    //     editable:false,
    //     filter: "agTextColumnFilter",
    //     valueFormatter: (params) => (params.value==="Active" ? "✔️" : ""), // show tick if true
    //     cellStyle: { textAlign: "center" }, // optional, center tick
    //   }


    {
        headerName: "Category",
        field: "categoryOptions",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: categoryOptions },
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Type",
        field: "type",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: typeOptions },
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Status",
        field: "status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: statusOptions },
        filter: "agSetColumnFilter",
      },

    {
        headerName: "IsActive",
        field: "isActive",
        filter: false,
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

  // ✅ Submit
//   const handleSubmit = (e) => {
//     e.preventDefault();
    // if (selectedModule && selectedScreen) {
        
    //   const sampleData = [
    //     {
    //       code: "1PM-H1450-10",
    //       name: "1PM-H1450-10.Adhesive_1",
    //       uom: "U0001",
    //       category: "CI",
    //       isActive: "Active",
    //     },
    //     {
    //       code: "1PM-H1450-10.Adhesive_2",
    //       name: "1PM-H1450-10.Adhesive_2",
    //       uom: "U0001",
    //       category: "FG",
    //     isActive: "Inactive",
    //     },
    //     {
    //       code: "1PM-H1450-10.Balancing_Machine",
    //       name: "1PM-H1450-10.Balancing_Machine",
    //       uom: "U0001",
    //       category: "CI",
    //       isActive: "Active",
    //     },
    //   ];
    //   setMasterList(sampleData);
    //   setOriginalList(sampleData); // keep original for filtering
    // }
    //setShowExtraCard(false);
//   };

  // ✅ Cancel
  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
   // setShowExtraCard(false);
  };

  // ✅ Add new row
//   const handleNewRowChange = (e) => {
//     const { name, value } = e.target;
//     setNewRow({ ...newRow, [name]: value });
//   };

//   const handleInsertRow = (e) => {
//     e.preventDefault();
//     if (newRow.code && newRow.name && newRow.uom && newRow.category) {
//       const updated = [...masterList, newRow];
//       setMasterList(updated);
//       setOriginalList(updated);
//       setNewRow({ code: "", name: "", uom: "", category: "", isActive: "Active" });
//       setShowExtraCard(false);
//     } else {
//       alert("Please fill all fields!");
//     }
//   };

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
        fileName: `StationMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1">
      {/* First Card */}
      {/* <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Master
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={() => setShowExtraCard(true)}
            title="Add Master"
          />
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-center">
              
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Module
                </label>
                <select
                  className="form-select"
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setSelectedScreen("");
                  }}
                  required
                >
                  <option value="">Select</option>
                  {Object.keys(moduleScreens).map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </div>

             
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <span className="text-danger">*</span> Screens
                </label>
                <select
                  className="form-select"
                  value={selectedScreen}
                  onChange={(e) => setSelectedScreen(e.target.value)}
                  required
                  disabled={!selectedModule}
                >
                  <option value="">Select</option>
                  {selectedModule &&
                    moduleScreens[selectedModule].map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            
            <div className="text-center mt-4">
              <button
                type="submit"
                className="btn text-white me-2"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              >
                Submit
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
          </form>
        </div>
      </div> */}

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

      {/* Extra Card - Add New Row */}
      {/* {showExtraCard && (
        <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
          <div
            className="card-header text-white fw-bold"
            style={{ backgroundColor: "#00264d" }}
          >
            Add New Product
          </div>
          <div className="card-body">
            <form onSubmit={handleInsertRow}>
              <div className="row g-3">
                {["code", "name", "uom", "category"].map((field, i) => (
                  <div className="col-md-3" key={i}>
                    <label className="form-label">
                      {field === "code"
                        ? "Product Code"
                        : field === "name"
                        ? "Product Description"
                        : field === "uom"
                        ? "UOM Code"
                        : "Category Code"}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={newRow[field]}
                      onChange={handleNewRowChange}
                      className="form-control"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="btn text-white me-2"
                  style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtraCard(false)}
                  className="btn btn-secondary"
                  style={{ minWidth: "90px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default EquipmentMaster;
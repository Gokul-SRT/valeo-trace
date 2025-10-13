import React, { useRef,useEffect,useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from 'ag-grid-community'; 
import { SetFilterModule } from 'ag-grid-enterprise'; 
import { DateFilterModule } from 'ag-grid-enterprise'; 
import { ExcelExportModule } from "ag-grid-enterprise";
import { Input, Button, Form, message } from "antd";
import store from "store";
import serverApi from '../../../serverAPI';
ModuleRegistry.registerModules([ SetFilterModule,
    DateFilterModule,ExcelExportModule]); 

const ProductMaster = ({modulesprop,screensprop}) => {
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
  /*
  useEffect(() => {
      setSelectedModule(modulesprop);
      setSelectedScreen(screensprop);
      if (selectedModule && selectedScreen) {
        const sampleData = [
          {
            productCode: "RM013",
            productDesc: "1PM-H1450-10.Adhesive_2",
            uom: "U0001",
            productCategoryDesc:"Category A",
            isActive: true,
          },
          {
            productCode: "RM014",
            productDesc: "1PM-H1450-10.Adhesive_1",
            uom: "U0001",
            productCategoryDesc:"Category A",
            isActive: true,
          },
          {
            productCode: "RM015",
            productDesc: "1PM-H1450-10.Balancing_Machine",
            uom: "U0001",
            productCategoryDesc:"Category B",
            isActive: false,
          },
        ];

        const updatedResponseData = sampleData.map((item)=>{
          return {
            ...item,
            isUpdate: 1
          }
        })
        console.log(updatedResponseData);
        setMasterList(updatedResponseData);
        setOriginalList(updatedResponseData);
      }
    }, [selectedModule, selectedScreen]); 
  
  */
  
    useEffect(()=>{
      setSelectedModule(modulesprop);
      setSelectedScreen(screensprop);
    },[modulesprop, screensprop])
    
    useEffect(() => {
      if (selectedModule && selectedScreen) {
        fetchData();
      }
    }, [selectedModule, selectedScreen])
    
    const fetchData = async () => {
      try {
        const response = await serverApi.post("getproductmasterdtl", {
          isActive: "1",
         /* tenantId: store.get('tenantId'),
          branchCode: store.get('branchCode')
          */
          tenantId: ('val'),
          branchCode: ('VAL')
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
        alert("Error fetching data. Please try again later.");
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
  
    const columnDefs = [
      {
          headerName: "Product Code",
          field: "productCode",
          filter: "agTextColumnFilter",
          editable: (params) => params.data.isUpdate === 0 ? true : false
        },
      { headerName: "Product Description", field: "productDesc",filter: "agTextColumnFilter" },
      { headerName: "UOM", field: "productUomCode",filter: "agTextColumnFilter" },
    //  { headerName: "Product Category Description", field: "productCategoryDesc",filter: "agTextColumnFilter" },
     
      {
          headerName: "IsActive",
          field: "isActive",
          filter: true,
          editable: true,
          cellRenderer: "agCheckboxCellRenderer",
          cellEditor: "agCheckboxCellEditor",
          // valueGetter: (params) => params.data.isActive === true,
          // valueSetter: (params) => {
          //   params.data.isActive = params.newValue ? true : false;
          //   return true;
          // },

          valueGetter: (params) => params.data.isActive === "1" || params.data.isActive === 1,
  valueSetter: (params) => {
    // when checkbox is clicked, set 1 for true, 0 for false
    params.data.isActive = params.newValue ? "1" : "0";
    return true;
  },
          cellStyle: { textAlign: "center" }
        }
      
    ];
  
  
  // Add new empty row
  const handleAddRow = () => {
      const emptyRow = {
        isUpdate:0
      };
      // columnDefs.forEach((col) => {
      //   emptyRow[col.field] = "";
      // });
      const productcodeempty = masterList.filter((item)=> !item.productCode);
      console.log(productcodeempty);
      if(productcodeempty && productcodeempty?.length === 0){
        const updated = [...masterList, emptyRow];
        setMasterList(updated);
        setOriginalList(updated);
      }else{
        message.error("Please enter the Product code for all the rows.");
        alert("Please enter the Product code for all the rows.");
      }
    };
  
  /*const createorUpdate =() =>{




    console.log(originalList);
  }*/

  const createorUpdate = async () => {
    try {

      const updatedList = masterList.map(item => ({
       /* ...item,
        tenantId: "valeo",
        branchCode: "0001" 
        */
       isUpdate:item.isUpdate,
       productCode:item.productCode,
       productCategoryCode:"FG",
       productUomCode:item.productUomCode,
       productDesc:item.productDesc,
       tenantId:"val",
       isActive:item.isActive,
       updatedBy:"E0001",
       branchCode:"VAL" ,
       isInventory:"0"

      }));

      const response = await serverApi.post("insertupdateproductmaster",updatedList);
  
      if (response.data && response.data === "SUCCESS") {
       // message.success("Data saved successfully!");
        alert("Data saved successfully!");
        fetchData();
      } else {
       // message.error("SaveOrUpdate failed.");
        alert("SaveOrUpdate failed.");
      }
    } catch (error) {
      console.error("Error saving product data:", error);
     // message.error("Error while saving data!");
     alert("Error while saving data!");
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
          fileName: `ProductMaster.xlsx`,
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
  }

export default ProductMaster;
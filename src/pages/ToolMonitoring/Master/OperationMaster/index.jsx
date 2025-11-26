import React, { useRef, useEffect, useState,forwardRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import { SetFilterModule } from "ag-grid-enterprise";
import { DateFilterModule } from "ag-grid-enterprise";
import {Select} from "antd";
import store from "store";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../.././Utills/Loader";
ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);


const { Option } = Select;

const MultiSelectEditor = forwardRef((props, ref) => {
  const field = props.colDef.field;
  const [selectedValues, setSelectedValues] = useState([]);

  // Initialize selection from row data
  useEffect(() => {
    const initial = props.data[field];
    if (typeof initial === "string" && initial.length > 0) {
      setSelectedValues(initial.split(",")); // convert string to array
    } else if (Array.isArray(initial)) {
      setSelectedValues(initial);
    } else {
      setSelectedValues([]);
    }
  }, [props.data, field]);

  // Provide value back to AG Grid
  React.useImperativeHandle(ref, () => ({
    getValue() {
      return selectedValues.join(","); // send as string to backend
    },
  }));


const handleChange = (values) => {
  setSelectedValues(values);                  // update local state
  props.node.setDataValue(field, values.join(",")); // update AG Grid row
};
  return (
    <Select
      mode="multiple"
      value={selectedValues}
      style={{ width: "100%" }}
      onChange={handleChange}
      placeholder="Select ChildPart Codes"
      options={(props.values || []).map((item) => ({
        label: item.value,  // display childPartCode
        value: item.key,    // send childPartId to backend
      }))}
    />
  );
});


const OperationMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [productMastOptions, setProductMastOptions] = useState([]);
  const [childPartMastOptions, setChildPartMastOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
      fetchData();
      productMastData();
      childPartMastData();
      //lineMastData();
    }
  }, [selectedModule, selectedScreen]);

  const fetchData = async (e) => {
    setIsLoading(true);
    try {
      const response = await serverApi.post("getoperationMasterdtl", {
        isActive:"getall",
        tenantId,
        branchCode,
        isTool:"1"
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
      }
    } catch (error) {
      toast.error("No data available");
    } finally {
      setIsLoading(false);
    }
  };


    const productMastData = async () => {
      try {
        const response = await serverApi.post("getProductDropdown", {
          tenantId,
          branchCode,
          isActive: "1",
        });
    
        const res = response.data;
        if (res.responseCode === "200" && Array.isArray(res.responseData)) {
          setProductMastOptions(res.responseData);
        } else {
          setProductMastOptions([]);
        }
      } catch (error) {
        
        toast.error("No data available");
      }
    };

    const childPartMastData = async () => {
      try {
        const response = await serverApi.post("getChildPartDropDown", {
          tenantId,
          branchCode,
          isActive: "1",
        });
    
        const res = response.data;
        if (res.responseCode === "200" && Array.isArray(res.responseData)) {
          const options = res.responseData.map(item => ({
            key: item.childPartId,    // send this to backend
            value: item.childPartCode // display this in dropdown
          }));
          setChildPartMastOptions(options);
        } else {
          setChildPartMastOptions([]);
        }
      } catch (error) {
        
        toast.error("No data available");
      }
    };


   /* const lineMastData = async () => {
      try {
        const response = await serverApi.post("getLineDropdown", {
          tenantId,
          branchCode,
          isActive: "1",
        });
    
        const res = response.data;
       if (res.responseCode === "200" && Array.isArray(res.responseData)) {
          setLineMastOptions(res.responseData);
        } else {
          setLineMastOptions([]);
        }
      } catch (error) {
        
        toast.error("Error fetching lineMastData. Please try again later.");
      }
    };

*/

  const updateCellValue = (params) => {
    const { colDef, newValue, data } = params;
    const field = colDef.field;

    setMasterList((prev) =>
      prev.map((row) => {
        const isTargetRow = (row.operationId && row.operationId === data.operationId) ||
          (row.localId && row.localId === data.localId);
        
        if (!isTargetRow) return row;
        
        const updated = { 
          ...row, 
          [field]: newValue,
          isUpdate: row.isUpdate === 0 ? 0 : 1
        };
        
        return updated;
      })
    );
  };

  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

    if ((newValue ?? "") === (oldValue ?? "")) return;

    setMasterList((prev) =>
      prev.map((row) => {
        const isTargetRow = (row.operationId && row.operationId === data.operationId) ||
          (row.localId && row.localId === data.localId);
        
        if (!isTargetRow) return row;
        
        const updated = { 
          ...row, 
          changed: true,
          isUpdate: row.isUpdate === 0 ? 0 : 1
        };
        
        updated[field] = newValue;
        return updated;
      })
    );
  };

  const createorUpdate = async () => {
    try {
      // Stop any active editing to capture current cell values
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      // Validation checks
      const operationIdEmpty = masterList.filter((item) => !item.operationId || item.operationId.trim() === "");
      const operationCodeEmpty = masterList.filter((item) => !item.operationUniquecode || item.operationUniquecode.trim() === "");
      const operationDescEmpty = masterList.filter((item) => !item.operationDesc || item.operationDesc.trim() === "");
      
      if (operationIdEmpty && operationIdEmpty?.length > 0) {
        toast.error("Please fill all mandatory fields");
        return;
      }
      
      if (operationCodeEmpty && operationCodeEmpty?.length > 0) {
        toast.error("Please fill all mandatory fields");
        return;
      }
      
      if (operationDescEmpty && operationDescEmpty?.length > 0) {
        toast.error("Please fill all mandatory fields");
        return;
      }

      // Check for changes
      const rowsToInsert = masterList.filter(row => row.isUpdate === 0);
      const rowsToUpdate = masterList.filter(row => row.changed === true);

      if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
        toast.info("No data available");
        return;
      }

      setIsLoading(true);
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
        isTool:"1",
      }));

      const response = await serverApi.post("insertupdateoperationmaster", updatedList);

      if (response?.data?.responseCode === '200') {
        toast.success("Add/Update successful")
        fetchData();
      } else {
        toast.error("Add/Update failed")
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Add/Update failed");
    } finally {
      setIsLoading(false);
    }
  }
  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const MandatoryHeaderComponent = (props) => {
    return (
      <div>
        {props.displayName} <span style={{color: 'red'}}>*</span>
      </div>
    );
  };

  const columnDefs = [
     {
      headerName: "Operation Id",
      field: "operationId",
      filter: "agTextColumnFilter",
      editable: (params) => (params.data.isUpdate === 0 ? true : false),
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Operation Id" }
    },
    {
      headerName: "Operation Code",
      field: "operationUniquecode",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Operation Code" }
      //editable: (params) => !params.data || !params.data.operationCode, 
     // editable: (params) => (params.data.isUpdate === 0 ? true : false),
    },
    {
      headerName: "Operation Description",
      field: "operationDesc",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Operation Description" }
    },
    {
      headerName: "Status",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => {
        return params.data.isActive === "1" || params.data.isActive === 1 || params.data.isActive === true;
      },
      valueSetter: (params) => {
        const newValue = params.newValue === true || params.newValue === "1" ? "1" : "0";
        if (params.data.isActive !== newValue) {
          params.data.isActive = newValue;
          params.data.isUpdate = params.data.isUpdate === 0 ? 0 : 1;
          return true;
        }
        return false;
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
            toast.error("Please fill all mandatory fields");
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
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => item.isActive === "0"));
    }
  };

  


  const onExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Operation Master Report");

    // === Row Height for header ===
    worksheet.getRow(1).height = 60;

    // === Define Columns ===
    worksheet.columns = [
      { header: "Operation ID", key: "operationId", width: 20 },
      { header: "Operation Code", key: "operationUniquecode", width: 25 },
      { header: "Operation Description", key: "operationDesc", width: 35 },
      { header: "ChildPart Code", key: "childPartId", width: 25 },
      { header: "Status", key: "isActive", width: 15 },
    ];

    // === Insert Left Logo (Valeo) ===
    try {
      const imgResponse = await fetch("/pngwing.com.png");
      const imgBlob = await imgResponse.blob();
      const arrayBuffer = await imgBlob.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 1 },
        editAs: "oneCell",
      });
    } catch {
      console.warn("Logo not found — skipping image insert.");
    }

    // === Title Cell ===
    worksheet.mergeCells("B1:D2");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = "Operation Master Report";
    titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // === Date (top right) ===
    worksheet.mergeCells("E1:F2");
    const dateCell = worksheet.getCell("E1");
    dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
    dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
    dateCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

    // === Insert Right Logo (SmartRun) ===
    try {
      const secondImgResponse = await fetch("/smartrunLogo.png");
      const secondImgBlob = await secondImgResponse.blob();
      const secondArrayBuffer = await secondImgBlob.arrayBuffer();
      const secondImageId = workbook.addImage({
        buffer: secondArrayBuffer,
        extension: "png",
      });
      worksheet.mergeCells("G1:H2");
      worksheet.addImage(secondImageId, {
        tl: { col: 6, row: 0 },
        br: { col: 8, row: 2 },
        editAs: "oneCell",
      });
    } catch {
      console.warn("SmartRun logo not found — skipping right logo insert.");
    }

    // === Header Row ===
    const headerRow = worksheet.addRow([
      "Operation ID",
      "Operation Code",
      "Operation Description",
      "ChildPart Code",
      "Status",
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 25;

    // === AutoFilter ===
    worksheet.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: headerRow.number, column: worksheet.columns.length },
    };

    // === Data Rows ===
    masterList.forEach((item) => {
      const newRow = worksheet.addRow({
        operationId: item.operationId || "",
        operationUniquecode: item.operationUniquecode || "",
        operationDesc: item.operationDesc || "",
        childPartId: item.childPartId || "",
        isActive: item.isActive === "1" ? "Active" : "Inactive",
      });

      newRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { size: 10 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // === Save File ===
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Operation_Master_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting to Excel. Please try again.");
  }
};



  return (
    <div>
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
          </div>

          <div className="card-body p-3">
            <div style={{ position: "relative" }}>
              {isLoading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.6)",
                    zIndex: 2,
                    borderRadius: "8px",
                  }}
                >
                  <Loader />
                </div>
              )}
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
                onCellValueChanged={onCellValueChanged}
              />
            </div>
            <div className="text-center mt-4">
              <button
                onClick={onExportExcel}
                className="btn text-white me-2"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                disabled={isLoading}
              >
                Excel Export
              </button>
              <button
                type="submit"
                className="btn text-white me-2"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                onClick={createorUpdate}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn text-white"
                style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                disabled={isLoading}
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

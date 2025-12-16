import React, { useRef, useEffect, useState, forwardRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import { SetFilterModule } from "ag-grid-enterprise";
// import { DateFilterModule } from "ag-grid-enterprise";
// import { ExcelExportModule } from "ag-grid-enterprise";

import { Input, Button, Form, message,Select } from "antd";
import { backendService } from "../../../service/ToolServerApi";
import { toast } from "react-toastify";
import store from "store";
// import serverApi from "../../../serverAPI";

import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../Utills/Loader"

// ModuleRegistry.registerModules([
//   SetFilterModule,
//   DateFilterModule,
//   ExcelExportModule,
// ]);

const { Option } = Select;
//  Custom MultiSelect Cell Editor

const MultiSelectEditor = forwardRef((props, ref) => {
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    if (props.data && props.colDef.field) {
      const initial = props.data[props.colDef.field];
      if (typeof initial === "string" && initial.length > 0) {
        setSelectedValues(initial.split(",").map(s => s.trim()));
      } else if (Array.isArray(initial)) {
        setSelectedValues(initial);
      } else {
        setSelectedValues([]);
      }
    }
  }, [props.data, props.colDef.field]);

  React.useImperativeHandle(ref, () => ({
    getValue() {
      const value = selectedValues.filter(v => v).join(","); // Remove empty values
      return value || null; // Return null for empty instead of empty string
    },
    isPopup() { return false; }
  }));

  const handleChange = (values) => {
    setSelectedValues(values || []);
    // CRITICAL: Trigger ag-grid value change properly
    props.onValueChange(values.filter(v => v).join(",") || null);
  };

  return (
    <Select
      mode="multiple"
      value={selectedValues}
      style={{ width: "100%" }}
      onChange={handleChange}
      placeholder="Select Product Codes"
      options={props.values?.map((item) => ({
        label: item.value,
        value: item.key,
      })) || []}
    />
  );
});



const LineMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [productData, setProductData] = useState([]);
  const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
  const [loading, setLoading] = useState(false);
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
      getProductDropDownData();
    }
  }, [selectedModule, selectedScreen]);
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("employeeId"));
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await backendService({requestPath:"getlineMasterdtl", 
        requestData:{
        isActive: "getAll",
        tenantId: tenantId,
        branchCode: branchCode,
      }});

      // ✅ Handle if backend sends null, undefined, or empty array
      if (!response || response.length === 0) {
        setMasterList([]);
        setOriginalList([]);
      } else {
        const updatedResponseData = response.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(structuredClone(updatedResponseData));
        console.log(updatedResponseData);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }finally {
      setLoading(false); // ✅ Stop loader
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
      const response = await backendService({requestPath:"getProductDropdown", requestData:payload});

     
      


      let returnData = [];


      if (response?.responseCode === '200' && response.responseData) {

     

        // toast.success(response.data.responseMessage);
        returnData = response.responseData;
      } else {

        toast.error(response.responseMessage || "Failed to load Child Parts.");

      }
      const options = returnData.map((item) => ({
        key: item.productCode || "",
        value: item.productCode || "",
      }));
      setProductData(options);
      return returnData;
    } catch (error) {
      console.error("Error fetching child part dropdown data:", error);
      toast.error("Error fetching data. Please try again later.");
      return [];
    }
  };


  const RequiredHeader = (props) => {
    return (
      <span>
        <span style={{ color: "red" }}>*</span> {props.displayName}
      </span>
    );
  };



  const columnDefs = [
    {
      headerName: "Line Code",
      field: "lineMstCode",
      filter: "agTextColumnFilter",
      // headerComponent: RequiredHeader,
      editable: (params) => (params.data.isUpdate === 0 ? true : false),
    },
    {
      headerName: "Line Description",
      field: "lineMstDesc",
      filter: "agTextColumnFilter",
      // headerComponent: RequiredHeader,
    },
  
   /* {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: MultiSelectEditor,
      cellEditorParams: { values: productData },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const keys =
          typeof params.value === "string"
            ? params.value.split(",")
            : params.value;
        return keys
          .map((k) => {
            const option = productData.find((item) => item.key === k);
            return option ? option.value : k;
          })
          .join(", ");
      },
    },
*/


{
  headerName: "Product Code",
  field: "productCode",
  filter: "agTextColumnFilter",
  editable: true,
  // headerComponent: RequiredHeader,
  cellEditor: MultiSelectEditor,
  cellEditorParams: { values: productData },
  valueSetter: (params) => {
    // ✅ Handle both string and array inputs
    const value = params.newValue;
    if (value === null || value === undefined || value === "") {
      params.data.productCode = null;
    } else if (typeof value === "string") {
      params.data.productCode = value;
    }
    return true;
  },
  valueFormatter: (params) => {
    if (!params.value) return "";
    const keys = typeof params.value === "string" ? params.value.split(",").map(k => k.trim()) : params.value;
    return keys
      .filter(k => k)
      .map((k) => {
        const option = productData.find((item) => item.key === k);
        return option ? option.value : k;
      })
      .join(", ");
  },
},


    {
      headerName: "Status",
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
      minWidth: 120,
      maxWidth: 160,
      flex: 1,   // dynamic resizing
    },
  ];

  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const linecodeempty = masterList.filter((item) => !item.lineMstCode);
    console.log(linecodeempty,"linecodeempty");
    if (linecodeempty && linecodeempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);

// Scroll to last page and focus new row after a small delay
setTimeout(() => {
  const api = gridRef.current?.api;
  if (!api) return;

  const lastRowIndex = updated.length - 1;
  const totalPages = api.paginationGetTotalPages();

  // Go to last page
  api.paginationGoToLastPage();

  // Ensure the last row is visible at the bottom
  setTimeout(() => {
    api.ensureIndexVisible(lastRowIndex, "bottom");

    // Flash the new row to draw attention
    api.flashCells({
      rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
    });

    // Focus and start editing on Product Code column
    const firstColId = "lineMstCode"; // field name of first editable column
    api.setFocusedCell(lastRowIndex, firstColId);
    api.startEditingCell({
      rowIndex: lastRowIndex,
      colKey: firstColId,
    });
  }, 150);
}, 100);

    } else {
      message.error("Please enter the Line code for all the rows.");
      toast.error("Please enter the Line code for all the rows.");
    }
  };

  const normalizeList = (list) => {
    return list.map(item => ({
      ...item,
      isActive: item.isActive === "1" || item.isActive === 1 || item.isActive === true ? "1" : "0"
    }));
  };

  const hasChanges = () => {
    const normMaster = normalizeList(masterList);
    const normOriginal = normalizeList(originalList);
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };


  const createorUpdate = async () => {
    try {
      setLoading(true);
 //  Commit any ongoing edits
 gridRef.current.api.stopEditing();
      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        return;
      }
  // Check EMPTY line codes
  const hasEmptyLineCode = masterList.some(
    (item) => !item.lineMstCode || item.lineMstCode.trim() === ""
  );

  if (hasEmptyLineCode) {
    toast.error("Please fill Line Code for all rows!");
    return;
  }
//  Validate: Line Description mandatory
const missingLineDesc = masterList.some(
  (item) => !item.lineMstDesc || item.lineMstDesc.trim() === ""
);
if (missingLineDesc) {
  toast.error("Line Description is required for all rows!");
  return;
}

//  Validate: Product Code mandatory (multi-select)
const missingProduct = masterList.some(
  (item) =>
    !item.productCode ||
    item.productCode === "" ||
    (Array.isArray(item.productCode) && item.productCode.length === 0)
);
if (missingProduct) {
  toast.error("Product Code is required for all rows!");
  return;
}

   // Check DUPLICATE line codes
   const lineCodes = masterList.map((item) => item.lineMstCode.trim());
   const duplicateCodes = lineCodes.filter(
     (code, index) => lineCodes.indexOf(code) !== index
   );

   if (duplicateCodes.length > 0) {
     toast.error(`Duplicate Line Code found: ${duplicateCodes[0]}`);
     return;
   }



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


      const response = await serverApi.post(
        "insertupdatelinemaster",
        updatedList
      );


      if (response && response.data === "SUCCESS") {
        toast.success("Add/Update successfully!");
        fetchData();

      } else if (response.data && response.data === "DUBLICATE") {

        toast.success("Do Not Allow Dublicate LineCode!");
      } else {
        toast.error("Unable to save data. Please try again later.");
        fetchData();
      }
    } catch (error) {
      console.error("Error saving product data:", error);
      toast.error("Error while saving data!");
      fetchData();
    }finally {
      setLoading(false); // ✅ Stop loader
    }
  };

  // ✅ Cancel
  const handleCancel = () => {
    setSelectedModule("");
   // setSelectedScreen("");
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

  // const onExportExcel = (ref) => {
  //   if (ref.current?.api) {
  //     ref.current.api.exportDataAsExcel({
  //       fileName: `LineMaster.xlsx`,
  //     });
  //   } else {
  //     alert("Grid is not ready!");
  //   }
  // };

const onExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Line Master");

    // ===== Column Widths (similar style) =====
    const columnWidths = [25, 35, 40, 18];
    columnWidths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
    });

    // ===== Title Row Height =====
    worksheet.getRow(1).height = 65;

    // ===== Left Logo =====
    try {
      const imgUrl = `${window.location.origin}/pngwing.com.png`;
      const logo1 = await fetch(imgUrl);
      const blob1 = await logo1.blob();
      const arr1 = await blob1.arrayBuffer();
      const imageId1 = workbook.addImage({
        buffer: arr1,
        extension: "png",
      });
      worksheet.addImage(imageId1, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 1 },
      });
    } catch {
      console.warn("Left logo not found");
    }

    // ===== Title Cell =====
    worksheet.mergeCells("B1:C1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Line Master\nGenerated On: ${moment().format(
      "DD/MM/YYYY HH:mm:ss"
    )}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF00264D" } };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    titleCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // ===== Right Logo =====
    try {
      const imgUrl1 = `${window.location.origin}/smartrunLogo.png`;
      const logo2 = await fetch(imgUrl1);
      const blob2 = await logo2.blob();
      const arr2 = await blob2.arrayBuffer();
      const imageId2 = workbook.addImage({
        buffer: arr2,
        extension: "png",
      });
      worksheet.addImage(imageId2, {
        tl: { col: 3, row: 0 },
        br: { col: 4, row: 1 },
      });
    } catch {
      console.warn("Right logo not found");
    }

    // ===== Header Row =====
    const startRow = 3;
    const headers = [
      "Line Code",
      "Line Description",
      "Product Code(s)",
      "Status",
    ];

    const headerRow = worksheet.getRow(startRow);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ===== Data Rows =====
    masterList.forEach((item, index) => {
      const rowNumber = startRow + index + 1;
      const row = worksheet.getRow(rowNumber);

      row.values = [
        item.lineMstCode || "",
        item.lineMstDesc || "",
        item.productCode || "",
        item.isActive === "1" ? "Active" : "Inactive",
      ];

      row.eachCell((cell) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // ===== AutoFilter =====
    worksheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow, column: headers.length },
    };

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Line_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting Line Master.");
  }
};



  return (
    <div>
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
              <label className="form-label fw-bold"><span className="text-danger">*</span>&nbsp;Status</label>
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
            paginationPageSizeSelector={[10, 25, 50, 100]}
            pagination
            domLayout="autoHeight"
            singleClickEdit={true}
            onFirstDataRendered={autoSizeAllColumns}
            // onCellValueChanged={(params) => {
            //   const updatedList = [...masterList];
            //   updatedList[params.rowIndex] = params.data;
            //   setMasterList(updatedList);
             
            // }}

            // Update masterList immediately after cell editing stops
    onCellEditingStopped={(params) => {
      const updatedList = [...masterList];
      updatedList[params.rowIndex] = { ...params.data }; // copy updated row
      setMasterList(updatedList);
    }}
          />

     {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <Loader />
            </div>
          )}
          <div className="text-center mt-4">
            <button
              onClick={onExportExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Excel Export
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

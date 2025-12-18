import React, { useRef, useEffect, useState, forwardRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import { SetFilterModule } from "ag-grid-enterprise";
// import { DateFilterModule } from "ag-grid-enterprise";
import { Select } from "antd";
import store from "store";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
// ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);


const { Option } = Select;
// 🔹 Custom MultiSelect Cell Editor
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


  /*
    const handleChange = (values) => {
      // Merge with current row value
      const existing = props.data[props.colDef.field]
        ? props.data[props.colDef.field].split(",")
        : [];
    
      // Create a unique set of codes
      const merged = Array.from(new Set([...existing, ...values]));
    
      setSelectedValues(merged);
      props.node.setDataValue(props.colDef.field, merged.join(","));
    };
  */
  const handleChange = (values) => {
    setSelectedValues(values);                  // update local state
    props.data[props.colDef.field] = values.join(",");
    // props.node.setDataValue(field, values.join(",")); // update AG Grid row
  };
  return (
    <Select
      mode="multiple"
      value={selectedValues}
      style={{ width: "100%" }}
      onChange={handleChange}
      placeholder="Select Child Part Codes"
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
  // const [mainList, setMainList] = useState([])
  // const [pageSize, setPageSize] = useState(10);
  //const [lineMastOptions, setLineMastOptions] = useState([]);
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
    try {
      const response = await serverApi.post("getoperationMasterdtl", {
        isActive: "getAll",
        tenantId,
        branchCode,
      });
      if (response?.data?.responseCode === '200') {
        console.log(response)
        const updatedResponseData = response?.data?.responseData.map((item) => ({
          ...item,
          isUpdate: 1,
          changed: false,
        }));
        setMasterList(updatedResponseData);
        // setOriginalList(updatedResponseData);
        setOriginalList(structuredClone(updatedResponseData));
        // setMainList(updatedResponseData)
      } else {
        setMasterList([]);
        setOriginalList([]);
        // setMainList([])
        toast.error(response.data.responseMessage)
      }
    } catch (error) {

      toast.error("Error fetching data. Please try again later.");
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

      toast.error("Error fetching productMastData. Please try again later.");
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

      toast.error("Error fetching ChildPartMastData. Please try again later.");
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
      gridRef.current.api.stopEditing();

      // if (!hasChanges()) {
      //   toast.error("Change any one field before saving.");
      //   return;
      // }

       const rowsToInsert = masterList.filter(row => row.isUpdate === "0" || row.isUpdate === 0);
        const rowsToUpdate = masterList.filter(row => row.changed === true && row.isUpdate !== "0" && row.isUpdate !== 0);

        console.log("masterList:", masterList);
        console.log("rowsToInsert:", rowsToInsert);
        console.log("rowsToUpdate:", rowsToUpdate);

        if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
          toast.info("Change any one field before saving.");
          return;
        }


    //   const OpeEmpty = masterList.filter((item) => !item.operationId || item.operationId.trim() === "");
    // const OpeCodeEmpty = masterList.filter((item) => !item.operationUniquecode || item.operationUniquecode.trim() === "");
    //  const OpeDescEmpty = masterList.filter((item) => !item.operationDesc || item.operationDesc.trim() === "");
    //   // const ChildpardcodeEmpty = masterList.filter((item) => !item.childPartId || item.childPartId.trim() === "");


    // if (OpeEmpty && OpeEmpty?.length > 0) {
    //   toast.error("Please fill all mandatory fields");
    //   return;
    // }

    //  if (OpeCodeEmpty && OpeCodeEmpty?.length > 0) {
    //   toast.error("Please fill all mandatory fields");
    //   return;
    // }

    //  if (OpeDescEmpty && OpeDescEmpty?.length > 0) {
    //   toast.error("Please fill all mandatory fields");
    //   return;
    // }

    //  if (ChildpardcodeEmpty && ChildpardcodeEmpty?.length > 0) {
    //   toast.error("Please fill all mandatory fields");
    //   return;
    // }

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
        // childPartCode: item.childPartId,
        //productCode:item.productCode,
        // lineCode:item.lineMstCode,
      }));
      const emptyRowss = masterList.filter((item) => !item.operationId && !item.operationUniquecode);
      if (emptyRowss && emptyRowss?.length === 0) {
        const response = await serverApi.post("insertupdateoperationmaster", updatedList);

        if (response?.data?.responseCode === '200') {
          toast.success(response.data.responseMessage)
        } else {
          toast.error(response.data.responseMessage)
        }
        fetchData();
      } else {
       toast.error("Please enter the mandatory fields.");
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

   const RequiredHeader = (props) => {
    const buttonRef = React.useRef(null);
    
    return (
      <div className="ag-cell-label-container" role="presentation">
        <span 
          ref={buttonRef}
          className="ag-header-icon ag-header-cell-filter-button" 
          onClick={() => props.showColumnMenu(buttonRef.current)}
        >
          <span className="ag-icon ag-icon-filter" role="presentation"></span>
        </span>
        <div className="ag-header-cell-label" role="presentation">
          <span className="ag-header-cell-text">{props.displayName} <span style={{color: 'red'}}>*</span></span>
        </div>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "Operation Id ",
      field: "operationId",
      filter: "agTextColumnFilter",
      editable: (params) => (params.data.isUpdate === 0 ? true : false),
       valueSetter: (params) => {
              const newValue = params.newValue?.trim();
              if (!newValue) {
                toast.error("Child Part Code is required!");
                return false;
              }
              const isDuplicate = masterList.some(
                (item) =>
                  item.operationId &&
                  item.operationId.toString().toLowerCase() ===
                    newValue.toLowerCase()
              );
      
              if (isDuplicate) {
                toast.error(`"${newValue}" already exists!`);
                return false;
              }
              params.data.operationId = newValue;
              params.data.changed = true;
              return true;
            },
      headerComponent: RequiredHeader,
    },
    {
      headerName: "Operation Code",
      field: "operationUniquecode",
      filter: "agTextColumnFilter",
       valueSetter: (params) => {
        params.data.operationUniquecode = params.newValue;
        params.data.changed = true;
        return true;
      },
      headerComponent: RequiredHeader,
      
    },
    {
      headerName: "Operation Description",
      field: "operationDesc",
      filter: "agTextColumnFilter",
      valueSetter: (params) => {
        params.data.operationDesc = params.newValue;
        params.data.changed = true;
        return true;
      },
      headerComponent: RequiredHeader,
    },
    /*  {
       headerName: "Production Parameter Count",
       field: "productionParameterCount",
       filter: "agTextColumnFilter",
     },
 */
    /* {
       headerName: "Product Code",
       field: "productCode",
       editable: true,
       cellEditor: "agSelectCellEditor",
       cellEditorParams: (params) => ({
         values: productMastOptions.map((p) => p.productCode), // show part IDs in dropdown
       }),
       valueFormatter: (params) => {
         const found = productMastOptions.find((p) => p.productCode === params.value);
         return found ? `${found.productDesc}` : params.value; // display description in grid
       },
       filter: "agTextColumnFilter",
       filterValueGetter: (params) => {
         const found = productMastOptions.find((p) => p.productCode === params.data.productCode);
         return found ? found.productDesc : ""; // search/filter by description
       },
     },
 */
    /*{
      headerName: "Product Code",
      field: "productCode",
      editable: true,
      cellEditor: MultiSelectEditor,
    
      cellEditorParams: (params) => ({
        // ✅ Proper structure for custom editor
        values: productMastOptions.map((p) => ({
          key: p.productCode,
          value: `${p.productCode} - ${p.productDesc}`
        })),
      }),
    
      valueFormatter: (params) => {
        if (!params.value) return "";
        const codes = typeof params.value === "string"
          ? params.value.split(",")
          : params.value;
    
        return codes
          .map((code) => {
            const cleanCode = code.trim();
            const option = productMastOptions.find(
              (p) => p.productCode === cleanCode
            );
            return option
              ? `${option.productCode} - ${option.productDesc}`
              : cleanCode;
          })
          .join(", ");
      },
    
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const option = productMastOptions.find(
          (p) => p.productCode === params.data.productCode
        );
        return option
          ? `${option.productCode} - ${option.productDesc}`
          : "";
      },
    },*/

    /*{
      headerName: "ChildPart Code",
      field: "childPartCode",
      editable: true,
      cellEditor: MultiSelectEditor,
    
      cellEditorParams: (params) => ({
        // ✅ Proper structure for custom editor
        values: childPartMastOptions.map((p) => ({
          key: p.childPartId,
          value: `${p.childPartCode} - ${p.childPartDesc}`
        })),
      }),
    
      valueFormatter: (params) => {
        if (!params.value) return "";
        const codes = typeof params.value === "string"
          ? params.value.split(",")
          : params.value;
    
        return codes
          .map((code) => {
            const cleanCode = code.trim();
            const option = childPartMastOptions.find(
              (p) => p.childPartId === cleanCode
            );
            return option
              ? `${option.childPartId} - ${option.childPartDesc}`
              : cleanCode;
          })
          .join(", ");
      },
    
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const option = childPartMastOptions.find(
          (p) => p.childPartId === params.data.childPartCode
        );
        return option
          ? `${option.childPartCode} - ${option.childPartDesc}`
          : "";
      },
    },
    
    */
    // {
    //   headerName: "Child Part Code",
    //   field: "childPartId", // holds childPartId(s) as string
    //   filter: "agTextColumnFilter",
    //   editable: true,
    //   cellEditor: MultiSelectEditor,
    //   headerComponent: RequiredHeader,
    //   cellEditorParams: { values: childPartMastOptions || [] }, // pass API data
    //   valueFormatter: (params) => {
    //     if (!params.value) return "";
    //     const ids = typeof params.value === "string" ? params.value.split(",") : params.value;
    //     return ids
    //       .map((id) => {
    //         const option = (childPartMastOptions || []).find((item) => item.key === id);
    //         return option ? option.value : id; // display childPartCode
    //       })
    //       .join(", ");
    //   },
    //   valueSetter: (params) => {
    //     params.data.childPartId = params.newValue;
    //     params.data.changed = true;
    //     return true;
    //   }
    // },





    /* {
       headerName: "Line Code",
       field: "lineMstCode",
       editable: true,
       cellEditor: "agSelectCellEditor",
       cellEditorParams: (params) => ({
         values: lineMastOptions.map((p) => p.lineMstCode), // show part IDs in dropdown
       }),
       valueFormatter: (params) => {
         const found = lineMastOptions.find((p) => p.lineMstCode === params.value);
         return found ? `${found.lineMstDesc}` : params.value; // display description in grid
       },
       filter: "agTextColumnFilter",
       filterValueGetter: (params) => {
         const found = lineMastOptions.find((p) => p.lineMstCode === params.data.lineMstCode);
         return found ? found.lineMstDesc : ""; // search/filter by description
       },
     },
 */

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
      operationId: "",
      operationUniquecode: "",
      isUpdate: 0,
      isActive: 1,
    };
    
    


    const emptyRowss = masterList.filter((item) => !item.operationId && !item.operationUniquecode);

    if (emptyRowss && emptyRowss?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);

      setTimeout(() => {
        const api = gridRef?.current?.api;
        if (api && api.paginationGetTotalPages) {
          const totalPages = api.paginationGetTotalPages();
          api.paginationGoToPage(Math.max(0, totalPages - 1));
        }
      }, 0);
    } else {
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
      const worksheet = workbook.addWorksheet("Operation Master");

      // ===== Column Setup =====
      worksheet.columns = [
        { width: 20 }, // Column A - Operation ID
        { width: 25 }, // Column B - Operation Code
        { width: 35 }, // Column C - Operation Description
        { width: 25 }, // Column D - Child Part Code
        { width: 15 }, // Column E - Status
      ];

      // ===== Logo Row =====
      worksheet.getRow(1).height = 50;

      // Left Logo in Column A
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
          ext: { width: 120, height: 40 },
        });
      } catch {
        console.warn("Left logo not found");
      }

      // Title in Column B-D
      worksheet.mergeCells("B1:D1");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `Operation Master\nGenerated: ${moment().format("DD/MM/YYYY HH:mm")}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      // Right Logo in Column E
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
          tl: { col: 4, row: 0 },
          ext: { width: 80, height: 40 },
        });
      } catch {
        console.warn("Right logo not found");
      }

      // ===== Table Headers (Row 3) =====
      const headerRow = 3;
      const headers = ["Operation ID", "Operation Code", "Operation Description", "Child Part Code", "Status"];
      
      worksheet.getRow(headerRow).height = 25;
      headers.forEach((header, idx) => {
        const cell = worksheet.getCell(headerRow, idx + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // ===== Data Rows =====
      masterList.forEach((item, index) => {
        const rowIndex = headerRow + index + 1;
        const row = worksheet.getRow(rowIndex);
        row.height = 20;

        row.values = [
          item.operationId || "",
          item.operationUniquecode || "",
          item.operationDesc || "",
          item.childPartId || "",
          item.isActive === "1" ? "Active" : "Inactive",
        ];

        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // ===== AutoFilter =====
      if (masterList.length > 0) {
        worksheet.autoFilter = {
          from: { row: headerRow, column: 1 },
          to: { row: headerRow + masterList.length, column: headers.length },
        };
      }

      // ===== Export =====
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Operation_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Operation Master.");
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
            onCellValueChanged={(params) => {
              const updatedList = [...masterList];
              updatedList[params.rowIndex] = structuredClone(params.data);
              // updatedList[params.rowIndex] = params.data;
              setMasterList(updatedList);
              // setOriginalList(updatedList);
            }}
          />
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

export default OperationMaster;

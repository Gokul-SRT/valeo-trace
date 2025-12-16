import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import { SetFilterModule } from "ag-grid-enterprise";
// import { DateFilterModule } from "ag-grid-enterprise";
import { toast } from "react-toastify";
import serverApi from '../../../serverAPI';
import { gettypeMasterdtl } from "../../../services/ChildPartMasterService"
import store from "store";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";

// ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);

const ChildPartMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [typeListResp, setTypeList] = useState([])
  const gridRef = useRef(null);

  const tenantId = store.get("tenantId")
  const branchCode = store.get('branchCode');
  const employeeId = store.get("employeeId")

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi.getAllColumns().map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
  }, [modulesprop, screensprop])

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData();
      fetchType();
    }
  }, [selectedModule, selectedScreen])

  const fetchType = async () => {
    let typeList = [];
    const responseList = await gettypeMasterdtl(tenantId, branchCode)
    if (responseList.responseCode == "200") {
      console.log(responseList.responseData, "typeList")
      typeList = responseList.responseData
      setTypeList(typeList)
    } else {
      setTypeList(typeList)
    }
  }



  const fetchData = async (e) => {
    try {
      const response = await serverApi.post("getchildpartMasterdtl", {
        isActive: e || "getall",
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
      } else {
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
        childPartCode: item.childPartCode,
        childPartDesc: item.childPartDesc,
        type:item.type,
        product: item.product,
        line: item.line,
        tenantId,
        status: item.status,
        updatedBy: employeeId,
        branchCode,
      }));
      console.log();
      const response = await serverApi.post("insertupdatechildpartmaster", updatedList);

      if (response?.data?.responseCode === '200') {
        toast.success(response.data.responseMessage)
      } else {
        toast.error(response.data.responseMessage)
      }
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Error while saving data!");
    }
  }

  const handleUpdateRow = async (rowData) => { console.log(rowData, "rowDatarowDatarowDatarowData") }
  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    { 
      headerName: "Child Part Code *", 
      field: "childPartCode", 
      filter: "agTextColumnFilter",
      // headerComponent: () => (
      //   <span>
      //     Child Part Code <span style={{ color: "red" }}>*</span>
      //   </span>
      // ),
    },
    { headerName: "Child Part Desc *", field: "childPartDesc", filter: "agTextColumnFilter" },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        // when checkbox is clicked, set 1 for true, 0 for false
        params.data.status = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      status: 1,
      
    };
    const childPartCodeEmpty = masterList.filter((item) => !item.childPartCode && !item.product);

    if (childPartCodeEmpty && childPartCodeEmpty?.length === 0) {
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
    fetchData()
  };

  // Filter change
  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => item.status === "1"));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => item.status === "0"));
    }
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Child Part Master");

      // ===== Column Setup =====
      worksheet.columns = [
        { width: 25 }, // Column A - Child Part Code
        { width: 35 }, // Column B - Child Part Description
        { width: 15 }, // Column C - Status
      ];

      // ===== Logo Row =====
      worksheet.getRow(1).height = 50;

      // Left Logo in Column A
      try {
        const logo1 = await fetch("/pngwing.com.png");
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

      // Title in Column B
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `Child Part Master\nGenerated: ${moment().format("DD/MM/YYYY HH:mm")}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      // Right Logo in Column C
      try {
        const logo2 = await fetch("/smartrunLogo.png");
        const blob2 = await logo2.blob();
        const arr2 = await blob2.arrayBuffer();
        const imageId2 = workbook.addImage({
          buffer: arr2,
          extension: "png",
        });
        worksheet.addImage(imageId2, {
          tl: { col: 2, row: 0 },
          ext: { width: 80, height: 40 },
        });
      } catch {
        console.warn("Right logo not found");
      }

      // ===== Table Headers (Row 3) =====
      const headerRow = 3;
      const headers = ["Child Part Code", "Child Part Description", "Status"];
      
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
          item.childPartCode || "",
          item.childPartDesc || "",
          item.status === "1" ? "Active" : "Inactive",
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
        `Child_Part_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Child Part Master.");
    }
  };


  return (
    <div>
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
              <label className="form-label fw-bold">Status</label>
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
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            pagination
            domLayout="autoHeight"
            singleClickEdit={true}
             overlayNoRowsTemplate="<span style='padding:10px; color:#555; font-size:14px;'>No data available</span>"
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
    </div>
  );
};

export default ChildPartMaster;

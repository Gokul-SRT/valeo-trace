// src/Service/OperationMasterService.js
import serverApi from "../../CommonserverApi";

const OperationMasterDropdown = async () => {
  try {
    // 🔹 Fetch tenantId and branchCode from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      isActive: "1",
      branchCode,
    };

    const response = await serverApi.post("getOperationMst", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (data && data.length > 0) {
      return data;
    } else {
      console.warn("No operation master data found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching operation master info:", error);
    return [];
  }
};

export default OperationMasterDropdown;

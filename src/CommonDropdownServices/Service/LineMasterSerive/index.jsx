// src/Service/LineMasterService.js
import serverApi from "../../../CommonserverApi";

const LineMstdropdown = async () => {
  try {
    // 🔹 Fetch tenantId dynamically from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      branchCode,
      isActive: "1",
    };

    const response = await serverApi.post("getCommonMstdtl", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const lineInfo = response.data;

    if (lineInfo && lineInfo.length > 0) {
      return lineInfo;
    } else {
      console.warn("No line master data found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Line Master info:", error);
    return [];
  }
};

export default LineMstdropdown;

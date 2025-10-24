// src/Service/Department.js
import serverApi from "../../CommonserverApi";

const DepartmentDropdown = async () => {
  try {
    // 🔹 Get tenantId from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      branchCode,
      isActive: "1",
    };

    const response = await serverApi.post("getDepartment", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching department info:", error);
    return [];
  }
};

export default DepartmentDropdown;

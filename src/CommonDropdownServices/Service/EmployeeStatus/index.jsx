// src/Service/EmployeeStatus.js
import serverApi from "../../CommonserverApi";

const EmployeeStatusDropdown = async () => {
  try {
    // 🔹 Dynamically get tenantId and branchCode from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      isActive: "1",
      branchCode,
    };

    const response = await serverApi.post("getEmployeeStatus", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("No Employee Status information found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching employee status info:", error);
    return [];
  }
};

export default EmployeeStatusDropdown;

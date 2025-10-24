// src/Service/EmployeeDesignation.js
import serverApi from "../../CommonserverApi";

const DesignationDropdown = async () => {
  try {
    // 🔹 Fetch from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      isActive: "1",
      branchCode,
    };

    const response = await serverApi.post("getEmployeeDesignation", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("No Employee Designation information found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching employee designation info:", error);
    return [];
  }
};

export default DesignationDropdown;

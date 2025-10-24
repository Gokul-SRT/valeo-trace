// src/Service/EmployeeCategory.js
import serverApi from "../../CommonserverApi";

const EmployeeCategoryDropdown = async () => {
  try {
    // 🔹 Fetch tenantId and branchCode from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      isActive: "1",
      branchCode,
    };

    const response = await serverApi.post("getEmployeeCategory", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("No Employee Category information found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching employee category info:", error);
    return [];
  }
};

export default EmployeeCategoryDropdown;

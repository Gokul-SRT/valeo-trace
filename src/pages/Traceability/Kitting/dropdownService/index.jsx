
import serverApi from "../../../../serverAPI";

const PicklistWODropdown = async (tenantId, branchCode) => {
  try {
    const payload = {
      planDate:'2025-10-23',
      tenantId: tenantId,
    //   isActive: "1",
      branchCode: branchCode,
    };

    const response = await serverApi.post("getPicklistWO", payload, {
      headers: { 
        "Content-Type": "application/json" 
      },
    });

    const data = response.data.responseData;

    if (data && data.length > 0) {
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching User Role info:", error);
    return [];
  }
};

export default PicklistWODropdown;
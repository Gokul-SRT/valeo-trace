// src/Service/ReasonCode.js
import serverApi from "../../serverAPI";

const ReasonCodedropdown = async (tenantId,branchCode) => {
  try {
    const payload = {
      tenantId: tenantId,
      isActive: "1",
      branchCode: branchCode,
    };

    const response = await serverApi.post("getReasonCodedtl", payload, {
      headers: {
        "Content-Type": "application/json",
        withCredentials: true,
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("reasoncode information not found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching reasoncode info:", error);
    return [];
  }
};

export default ReasonCodedropdown;
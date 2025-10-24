// src/Service/ReasonCodeType.js
import serverApi from "../../serverAPI";

const ReasonCodeTypedropdown = async (tenantId,branchCode) => {
  try {
    const payload = {
      tenantId: tenantId,
      isActive: "1",
      branchCode: branchCode,
    };

    const response = await serverApi.post("getReasonCodeTypedtl", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("ReasonCodeTypedropdown information found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching ReasonCodeTypedropdown info:", error);
    return [];
  }
};

export default ReasonCodeTypedropdown;
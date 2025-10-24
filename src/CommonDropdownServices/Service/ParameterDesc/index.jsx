import serverApi from "../../serverAPI";
import store from "store";

export const fetchParameterDescList = async () => {
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));

  try {
    const payload = { tenantId, branchCode, isActive: "1" };

    const response = await serverApi.post("getParameterDescdtl", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      // Normalize structure
      return data.map((item) => ({
        paCode: item.paCode,
        paDesc: item.paDesc || item.paCode,
      }));
    } else {
      console.warn("No Parameter Description records found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Parameter Description data:", error);
    return [];
  }
};

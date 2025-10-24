// src/Service/ShiftMstService.js
import serverApi from "../../CommonserverApi";
import moment from "moment";

const ShiftMstDropdown = async (selectedDate) => {
  try {
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
   

    const payload = {
      tenantId,
      date: selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
    };

    const response = await serverApi.post("shiftlogShiftMst", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const shiftData = response.data;

    if (shiftData && shiftData.length > 0) {
      return shiftData;
    } else {
      console.warn("No Shift Master data found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Shift Master info:", error);
    return [];
  }
};

export default ShiftMstDropdown;

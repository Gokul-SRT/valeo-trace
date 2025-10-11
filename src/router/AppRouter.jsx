import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Master from "../pages/Master/MainMaster";
import TraceabilityReport from "../pages/Traceability/Reports";
import Picklist from "../pages/Traceability/Reports/Picklist/Picklist";
import Linefeeder from "../pages/Traceability/Reports/Linefeeder/Linefeeder";
import StoreReturnable from "../pages/Traceability/StoreReturnable/StoreReturnable";
import Traceabilityreports from "../pages/TraceabilityReport/TraceabilityReport";
import ReverseTraceabilityReport from "../pages/TraceabilityReport/ReverseTraceabilityReport";
import Kittingprocessscreen from "../pages/Traceability/Kitting";
import LineDashboard from "../pages/Traceability/Dashboard";
import ToolChange from "../pages/ToolMonitoring/Reports/ToolChange";
import ToolHistoryLog from "../pages/ToolMonitoring/Reports/ToolHistoryLog";
import CriticalSparePartsList from "../pages/ToolMonitoring/Reports/CriticalSparePartsList";
import PreventiveMaintenanceCheckList from "../pages/ToolMonitoring/Reports/PMchecklist";
import ToolMonitoringMaster from "../pages/ToolMonitoring/Master/MainMaster";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* default route */}
          <Route path="/" element={<Picklist />} />
          <Route path="/picklist" element={<Picklist />} />
         
          <Route path="/tracemaster" element={<Master />} />
         
          <Route path="/traceabilityReports" element={<TraceabilityReport />} />
          <Route path="/picklist" element={<Picklist />} />
          <Route path="/linefeeder" element={<Linefeeder />} />
          <Route path="/storeReturnable" element={<StoreReturnable />} />
          <Route
            path="/Traceabilityreports1"
            element={<Traceabilityreports />}
          />
          <Route
            path="/reversetraceabilityReports"
            element={<ReverseTraceabilityReport />}
          />
          <Route
            path="/Kittingprocessscreen"
            element={<Kittingprocessscreen />}
          />
          <Route path="/lineDashboard" element={<LineDashboard />} />
          <Route path="/toolChange" element={<ToolChange/>} />
          <Route path="/ToolHistoryLog" element={<ToolHistoryLog/>} />
          <Route path="/CriticalSparePartsList" element={<CriticalSparePartsList/>} />
          <Route path="/PreventiveMaintenanceCheckList" element={<PreventiveMaintenanceCheckList/>} />
          <Route path="/toolmonitoringmaster" element={<ToolMonitoringMaster />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

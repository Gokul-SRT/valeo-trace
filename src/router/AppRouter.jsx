import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Master from "../pages/Master/MainMaster";
import TraceabilityReport from "../pages/Traceability/Reports";
import Picklist from "../pages/Traceability/Reports/Picklist/Picklist";
import Linefeeder from "../pages/Traceability/Reports/Linefeeder/Linefeeder";
import StoreReturnable from "../pages/Traceability/StoreReturnable/StoreReturnable";
import Traceabilityreports from "../pages/TraceabilityReport/TraceabilityReport";
import ReverseTraceabilityReport from "../pages/TraceabilityReport/ReverseTraceabilityReport";
import Kittingprocessscreen from "../pages/Traceability/Kitting/KittingContainer";
import LineDashboard from "../pages/Traceability/Dashboard";
import ToolChange from "../pages/ToolMonitoring/Reports/ToolChange";
import ToolHistoryLog from "../pages/ToolMonitoring/Reports/ToolHistoryLog";
import CriticalSparePartsList from "../pages/ToolMonitoring/Reports/CriticalSparePartsList";
import PreventiveMaintenanceCheckList from "../pages/ToolMonitoring/Reports/PMchecklist";
import ToolMonitoringMaster from "../pages/ToolMonitoring/Master/MainMaster";
import TraceabilityLog from "../pages/Traceability/TraceabilityLog/TraceabilityLog";
import CycleTimeAnalysis from "../pages/Traceability/CycleTimeAnalysis/CycleTimeAnalysis";
import PickListPrintMain from "../pages/Traceability/Reports/Picklist/PrintPageWithQR";
import NextProcessTraceabilityLog from "../pages/ToolMonitoring/NextProcessTraceabilityLog";
import GatewayDashboard from "../pages/Traceability/Dashboard/GatewayDashboard";
import LabelPrint from "../pages/Traceability/LabelPrint";
import ExternalRedirect from "./ExternalRedirect";
import NotFound from "../Errors/404";
import PicklistVerification from "../pages/Traceability/Reports/PicklistVerification";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export default function AppRouter() {
  // Get accessToken from cookies
  const accessToken = getCookie('accessToken');
  const isAuthenticated = !!accessToken;
  
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<ExternalRedirect />} />
           {isAuthenticated ? (
        <Route element={<MainLayout />}>
        
          <Route path="/picklist" element={<Picklist />} />
          <Route path="/tracemaster" element={<Master />} />
          <Route path="/traceabilityReports" element={<TraceabilityReport />} />
          <Route path="/linefeeder" element={<Linefeeder />} />
          <Route path="/storeReturnable" element={<StoreReturnable />} />
          <Route path="/Traceabilityreports1" element={<Traceabilityreports />} />
          <Route path="/reversetraceabilityReports" element={<ReverseTraceabilityReport />} />
          <Route path="/Kittingprocessscreen" element={<Kittingprocessscreen />} />
          <Route path="/lineDashboard" element={<LineDashboard />} />
          <Route path="/toolChange" element={<ToolChange />} />
          <Route path="/ToolHistoryLog" element={<ToolHistoryLog />} />
          <Route path="/CriticalSparePartsList" element={<CriticalSparePartsList />} />
          <Route path="/PreventiveMaintenanceCheckList" element={<PreventiveMaintenanceCheckList />} />
          <Route path="/toolmonitoringmaster" element={<ToolMonitoringMaster />} />
          <Route path="/traceabilitylog" element={<TraceabilityLog />} />
          <Route path="/cycletimeanalysis" element={<CycleTimeAnalysis />} />
          <Route path="/picklistprint" element={<PickListPrintMain />} />
          <Route path="/nextProcess" element={<NextProcessTraceabilityLog />} />
          <Route path="/gatewaydashbaord" element={<GatewayDashboard />} />
          <Route path="/labelPrint" element={<LabelPrint />} />
          <Route path="/externalapp" element={<ExternalRedirect />} />
           <Route path="/notfound404" element={<NotFound />} />
           <Route path="/picklist-verification" element={<PicklistVerification />} />
        </Route>
            ):(
              <Route path="*" element={<NotFound />} />
            )}
      </Routes>
       
    </BrowserRouter>
  );
}
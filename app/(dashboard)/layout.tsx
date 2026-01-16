import GlobalDataProvider from "src/providers/GlobalDataProvider";

import Footer from "./components/Layout/Footer";
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import PaymentConfigWarningBanner from "./components/PaymentConfigWarningBanner/PaymentConfigWarningBanner";

const DashboardLayout = ({ children }) => {
  return (
    <GlobalDataProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 relative overflow-hidden">
          <Sidebar />
          <div className="ml-[19rem] flex flex-col h-full">
            <PaymentConfigWarningBanner />
            <div className="flex-1 overflow-auto bg-gray-25">{children}</div>
            <Footer />
          </div>
        </div>
      </div>
    </GlobalDataProvider>
  );
};

export default DashboardLayout;

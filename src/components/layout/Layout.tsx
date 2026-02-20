import { Outlet } from "react-router-dom";
import Header from "../Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="h-screen min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto ml-16 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

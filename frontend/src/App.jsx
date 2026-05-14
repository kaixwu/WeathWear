import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { DataProvider } from "./DataContext";
import Login from "./Login";
import Register from "./Register";
import Admin from "./Admin";
import Home from "./pages/Home";
import Weather from "./pages/Weather";
import Destinations from "./pages/Destinations";
import Planner from "./pages/Planner";
import MyTrips from "./pages/MyTrips";
import Navbar from "./components/Navbar";


export default function App() {
  const { token, role } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/my-trips" element={<MyTrips />} />
        {role === "admin" && <Route path="/admin" element={<Admin />} />}
        
        {/* Default route redirect */}
        <Route path="*" element={<Navigate to={role === "admin" ? "/admin" : "/home"} />} />
      </Routes>
    </DataProvider>
  );
}
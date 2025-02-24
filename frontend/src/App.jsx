import NavBar from "./components/NavBar.jsx"
import { Routes, Route } from "reacter-router-dom";
import  HomePage from "./pages/HomePage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DirectMessagingPage } from "./pages/DirectMessagingPage.jsx";
import { ChannelsPage } from "./pages/ChannelsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { Loader } from "lucide-react";// the spinning wheel loading wheel


const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });
  
  //this is the spinning wheel 
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage/>: <Navigate to="/login"/>}/>
        <Route path="/register" element={!authUser ? <RegisterPage/>: <Navigate to="/"/>}/>
        <Route path="/login" element={!authUser ?<LoginPage/>: <Navigate to="/"/>}/>

        {/* This is for user and admin also i think*/}
        <Route path="/DM" element={<DirectMessagingPage/>}/>
        <Route path="/channels" element={<ChannelsPage/>}/>


        {/* This is for admin */}
        <Route path="/adminPage" element={<AdminPage/>}></Route>
        
        
      </Routes>
    </div>
  );
};

export default App;

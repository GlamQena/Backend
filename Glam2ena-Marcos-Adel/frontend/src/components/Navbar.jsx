import { Moon, Sun, LogIn, PersonStanding, LogOut}from "lucide-react";
import * as Icons from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {useLocation} from "react-router-dom";
import "./Navbar.css";
import { isUserLogged, logout } from "../services/authService";

function Navbar() {
  console.log("lucide-react icons-> ", Object.keys(Icons));
  const {theme, setTheme}=  useTheme();

  const location = useLocation();
  console.log("location pathname => ", location.pathname);

  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">
        <div className="nav-right">
          {(location.pathname !== "/login" && !isUserLogged()) && <a href="/login" title="login"><LogIn></LogIn></a>}
          {isUserLogged() && <a title="logout" onClick={async () => await logout()}><LogOut></LogOut></a>}
          {(location.pathname !== "/profile" && isUserLogged()) && <a href="/profile" title="profile"><PersonStanding></PersonStanding></a>}
          {location.pathname !== "/" && <a href="/" title="Home" className="nav-logo">
            Qena <span>Glam</span> <div className="logo-dot"></div>{" "}
            <span>قنا</span>
          </a>}
        </div>

        <div className="nav-left">
          <div className="mode-toggler" title="Theme-toggler" onClick={() => setTheme(prevTheme => prevTheme==="dark"? "light" : "dark")}>
            {theme==="dark" ? <Sun size={18} /> : <Moon size={18} />}
          </div>
        </div>

      </nav>
    </div>
  );
}

export default Navbar;
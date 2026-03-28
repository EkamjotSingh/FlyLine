import { NavLink } from "react-router-dom";
import { Plane, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">TSA OnTime</span>
        </div>
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Pre-Arrival Rec</span>
          </NavLink>
          <NavLink
            to="/at-airport"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">At the Airport Rec</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

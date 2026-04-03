import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut, LayoutDashboard, Users, UserCog, Receipt, WalletCards, Banknote, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

// Menu items with role requirements
const allItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "resident"],
  },
  {
    title: "Data Warga",
    url: "/warga",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Data Pengurus",
    url: "/pengurus",
    icon: UserCog,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Pembayaran Iuran",
    url: "/iuran",
    icon: Receipt,
    roles: ["super_admin", "admin", "resident"],
  },
  {
    title: "Arus Kas",
    url: "/kas",
    icon: WalletCards,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Penggajian",
    url: "/penggajian",
    icon: Banknote,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Forum Warga",
    url: "/forum",
    icon: MessageSquare,
    roles: ["super_admin", "admin", "resident"],
  },
];

export function AppSidebar({ role = "resident" }) {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const filteredItems = allItems.filter(item => item.roles.includes(role));

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-semibold leading-none text-neutral-900">PerumahanKu</span>
            <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-bold">
              {role === 'resident' ? 'Warga' : 'Administrator'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold uppercase">
            {profile?.nama?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{profile?.nama || "User"}</span>
            <span className="text-xs text-neutral-500 truncate">{user?.email}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

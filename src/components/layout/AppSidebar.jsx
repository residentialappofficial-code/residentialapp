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
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Receipt, 
  WalletCards, 
  Banknote, 
  MessageSquare 
} from "lucide-react";

// Menu items
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Data Warga",
    url: "/warga",
    icon: Users,
  },
  {
    title: "Data Pengurus",
    url: "/pengurus",
    icon: UserCog,
  },
  {
    title: "Pembayaran Iuran",
    url: "/iuran",
    icon: Receipt,
  },
  {
    title: "Arus Kas",
    url: "/kas",
    icon: WalletCards,
  },
  {
    title: "Penggajian",
    url: "/penggajian",
    icon: Banknote,
  },
  {
    title: "Forum Warga",
    url: "/forum",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-semibold leading-none text-neutral-900">PerumahanKu</span>
            <span className="text-xs text-neutral-500 mt-1">Sistem Manajemen</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin Paguyuban</span>
            <span className="text-xs text-neutral-500">admin@perumahan.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

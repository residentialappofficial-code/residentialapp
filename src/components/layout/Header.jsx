import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 md:px-6">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}

      <div className="w-full flex-1">
        <form>
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              type="search"
              placeholder="Cari data warga, transaksi..."
              className="w-full bg-neutral-50 pl-9 border-none shadow-none focus-visible:ring-1 focus-visible:ring-neutral-200"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-neutral-600" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600"></span>
          <span className="sr-only">Notifikasi</span>
        </Button>
      </div>
    </header>
  );
}

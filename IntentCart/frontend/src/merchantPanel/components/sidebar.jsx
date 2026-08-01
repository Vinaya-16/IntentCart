import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Package, 
  ClipboardList, 
  Users, 
  History, 
  Megaphone 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'product', label: 'Product Management', icon: Package },
  { id: 'order', label: 'Order Management', icon: ClipboardList },
  { id: 'customer', label: 'Customer Analysis', icon: Users },
  { id: 'recovery', label: 'Recovery Dashboard', icon: History },
  { id: 'campaign', label: 'Campaign Management', icon: Megaphone },
];

const Sidebar = () => {
  const [active, setActive] = useState('dashboard');

  return (
    <aside className="w-64 bg-[#1e3a6a] min-h-[calc(100vh-4rem)] pt-6 pr-4 shrink-0">
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-r-full font-medium text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#1e3a6a] shadow-md font-semibold'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Shield, Calendar, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const StatCard = (props) => {
  const { title, value, icon: IconComp, color } = props;
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600'
  };
  
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorMap[color]}`}>
        <IconComp className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function DataPengurus() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const { data: staff } = await supabase
        .from('pengurus')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      setData(staff || []);
    } catch {
      console.error("Error fetching staff data");
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item => 
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="bg-transparent">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Management Staff</h1>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Staff" value={data.length} icon={Shield} color="indigo" />
          <StatCard title="Active Period" value="2025-2027" icon={Calendar} color="green" />
          <StatCard title="Status" value="Active" icon={UserCheck} color="blue" />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text"
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Staff Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Position</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No staff records.</td>
                  </tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                          {item.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{item.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold">
                        {item.jabatan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.no_hp || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.periode}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><Edit className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

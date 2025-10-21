import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Video, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UsageStatsProps {
  user: User | null;
}

type DateFilter = "today" | "yesterday" | "week" | "15days" | "month" | "3months" | "year";

interface UsageData {
  totalCost: number;
  videoCount: number;
  logs: Array<{
    id: string;
    created_at: string;
    cost: number;
    action: string;
    metadata: any;
  }>;
}

const UsageStats = ({ user }: UsageStatsProps) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [usageData, setUsageData] = useState<UsageData>({ totalCost: 0, videoCount: 0, logs: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();

    switch (dateFilter) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "15days":
        startDate.setDate(now.getDate() - 15);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from("usage_logs")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading usage data:", error);
        return;
      }

      const totalCost = data.reduce((sum, log) => sum + Number(log.cost), 0);
      setUsageData({
        totalCost,
        videoCount: data.length,
        logs: data,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = () => {
    const labels: Record<DateFilter, string> = {
      today: "Hoy",
      yesterday: "Ayer",
      week: "Esta semana",
      "15days": "Últimos 15 días",
      month: "Este mes",
      "3months": "Últimos 3 meses",
      year: "Este año",
    };
    return labels[dateFilter];
  };

  return (
    <div className="bg-card shadow-card rounded-xl p-4 space-y-3">
      {/* Compact header with stats inline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Uso de Créditos</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Gasto: <span className="font-medium text-primary">
                  ${loading ? "..." : usageData.totalCost.toFixed(2)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Videos: <span className="font-medium">
                  {loading ? "..." : usageData.videoCount}
                </span>
              </span>
            </div>
          </div>
        </div>

        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="yesterday">Ayer</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="15days">Últimos 15 días</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
            <SelectItem value="year">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Collapsible history section */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <span>Historial ({getFilterLabel()})</span>
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : usageData.logs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No hay registros para {getFilterLabel().toLowerCase()}</p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
              {usageData.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-secondary/10 rounded-md border border-border/20 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <Video className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        {log.action} • {log.metadata?.request?.model || 'N/A'} • {log.metadata?.request?.size || 'N/A'} • {log.metadata?.request?.duration || 'N/A'}s
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-primary">
                    ${Number(log.cost).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default UsageStats;

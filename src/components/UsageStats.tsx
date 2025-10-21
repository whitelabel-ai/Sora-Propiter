import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Video } from "lucide-react";
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
    amount_usd: number;
    model: string;
    size: string;
    seconds: number;
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

      const totalCost = data.reduce((sum, log) => sum + Number(log.amount_usd), 0);
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
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Registro de Gastos</h2>
            <p className="text-sm text-muted-foreground">Monitorea tu uso de créditos</p>
          </div>
        </div>

        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[180px]">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-secondary/30 border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-2xl font-bold text-primary">
                ${loading ? "..." : usageData.totalCost.toFixed(2)} USD
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-secondary/30 border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos Generados</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : usageData.videoCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {usageData.logs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Historial ({getFilterLabel()})</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {usageData.logs.map((log) => (
              <Card key={log.id} className="p-3 bg-secondary/20 border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {log.model} • {log.size} • {log.seconds}s
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
                  <p className="text-sm font-bold text-primary">
                    ${Number(log.amount_usd).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && usageData.logs.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay registros de uso para {getFilterLabel().toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
};

export default UsageStats;

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle 
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    faturamentoHoje: 0,
    produtosEstoque: 0,
    produtosBaixoEstoque: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const hoje = new Date().toISOString().split('T')[0];

    // Vendas de hoje
    const { data: vendas } = await supabase
      .from("vendas")
      .select("total")
      .eq("status", "finalizada")
      .gte("data_venda", `${hoje}T00:00:00`)
      .lte("data_venda", `${hoje}T23:59:59`);

    const vendasHoje = vendas?.length || 0;
    const faturamentoHoje = vendas?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

    // Produtos em estoque
    const { data: produtos } = await supabase
      .from("produtos")
      .select("estoque_atual, estoque_minimo")
      .eq("ativo", true);

    const produtosEstoque = produtos?.length || 0;
    const produtosBaixoEstoque = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo).length || 0;

    setStats({
      vendasHoje,
      faturamentoHoje,
      produtosEstoque,
      produtosBaixoEstoque,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Hoje
            </CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.faturamentoHoje)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas Hoje
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendasHoje}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos em Estoque
            </CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produtosEstoque}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Estoque Baixo
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.produtosBaixoEstoque}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Resumo de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho das suas vendas diárias e identifique oportunidades de crescimento.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Gestão de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Controle seus produtos e receba alertas quando o estoque estiver baixo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

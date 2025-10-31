import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
<<<<<<< HEAD
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
=======
import {
  DollarSign,
  ShoppingCart,
  Package,
>>>>>>> 327c551 (Subindo correções iniciais)
  TrendingUp,
  AlertTriangle,
  Users,
  Plus,
<<<<<<< HEAD
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
=======
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// =====================
// Tipos usados
// =====================
interface Produto {
  nome: string;
  quantidade: number;
  valor: number;
}

interface Venda {
  id: number;
  total: number;
  data_venda: string;
  clientes?: {
    nome: string;
  } | null;
}

interface GraficoVenda {
  data: string;
  valor: number;
}

interface Stats {
  vendasHoje: number;
  faturamentoHoje: number;
  faturamentoMes: number;
  produtosEstoque: number;
  produtosBaixoEstoque: number;
  totalClientes: number;
  totalFornecedores: number;
}

// =====================
// Componente principal
// =====================
export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats>({
>>>>>>> 327c551 (Subindo correções iniciais)
    vendasHoje: 0,
    faturamentoHoje: 0,
    faturamentoMes: 0,
    produtosEstoque: 0,
    produtosBaixoEstoque: 0,
    totalClientes: 0,
    totalFornecedores: 0,
  });
<<<<<<< HEAD
  const [topProdutos, setTopProdutos] = useState<any[]>([]);
  const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);
  const [graficoVendas, setGraficoVendas] = useState<any[]>([]);
=======

  const [topProdutos, setTopProdutos] = useState<Produto[]>([]);
  const [ultimasVendas, setUltimasVendas] = useState<Venda[]>([]);
  const [graficoVendas, setGraficoVendas] = useState<GraficoVenda[]>([]);
>>>>>>> 327c551 (Subindo correções iniciais)

  useEffect(() => {
    loadDashboardData();
  }, []);

<<<<<<< HEAD
  const loadDashboardData = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Vendas de hoje
    const { data: vendas } = await supabase
      .from("vendas")
      .select("total")
      .eq("status", "finalizada")
      .gte("data_venda", `${hoje}T00:00:00`)
      .lte("data_venda", `${hoje}T23:59:59`);

    const vendasHoje = vendas?.length || 0;
    const faturamentoHoje = vendas?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

    // Faturamento do mês
    const { data: vendasMes } = await supabase
      .from("vendas")
      .select("total")
      .eq("status", "finalizada")
      .gte("data_venda", `${inicioMes}T00:00:00`);

    const faturamentoMes = vendasMes?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

    // Produtos em estoque
    const { data: produtos } = await supabase
      .from("produtos")
      .select("estoque_atual, estoque_minimo")
      .eq("ativo", true);

    const produtosEstoque = produtos?.length || 0;
    const produtosBaixoEstoque = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo).length || 0;

    // Clientes e Fornecedores
    const { count: totalClientes } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true });

    const { count: totalFornecedores } = await supabase
      .from("fornecedores")
      .select("*", { count: "exact", head: true });

    // Top 5 produtos mais vendidos
    const { data: itensVendas } = await supabase
      .from("vendas_itens")
      .select(`
        quantidade,
        produtos:produto_id (nome, preco_venda)
      `);

    const produtosAgrupados = itensVendas?.reduce((acc: any, item: any) => {
      const produtoNome = item.produtos?.nome || "Desconhecido";
      if (!acc[produtoNome]) {
        acc[produtoNome] = {
          nome: produtoNome,
          quantidade: 0,
          valor: item.produtos?.preco_venda || 0,
        };
      }
      acc[produtoNome].quantidade += item.quantidade;
      return acc;
    }, {});

    const topProdutos = Object.values(produtosAgrupados || {})
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Últimas 5 vendas
    const { data: ultimasVendas } = await supabase
      .from("vendas")
      .select(`
        *,
        clientes:cliente_id (nome)
      `)
      .order("data_venda", { ascending: false })
      .limit(5);

    setStats({
      vendasHoje,
      faturamentoHoje,
      faturamentoMes,
      produtosEstoque,
      produtosBaixoEstoque,
      totalClientes: totalClientes || 0,
      totalFornecedores: totalFornecedores || 0,
    });

    setTopProdutos(topProdutos as any);
    setUltimasVendas(ultimasVendas as any || []);

    // Gráfico de vendas dos últimos 30 dias
    const { data: vendasGrafico } = await supabase
      .from("vendas")
      .select("data_venda, total")
      .eq("status", "finalizada")
      .gte("data_venda", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("data_venda");

    const dadosGrafico = vendasGrafico?.reduce((acc: any, venda) => {
      const data = new Date(venda.data_venda).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const existente = acc.find((item: any) => item.data === data);
      if (existente) {
        existente.valor += Number(venda.total);
      } else {
        acc.push({ data, valor: Number(venda.total) });
      }
      return acc;
    }, []) || [];

    setGraficoVendas(dadosGrafico);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
=======
  const loadDashboardData = async (): Promise<void> => {
    try {
      const hoje = new Date();
      const inicioDia = new Date(hoje.setHours(0, 0, 0, 0)).toISOString();
      const fimDia = new Date(hoje.setHours(23, 59, 59, 999)).toISOString();
      const inicioMes = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const [
        vendasHojeRes,
        vendasMesRes,
        produtosRes,
        clientesRes,
        fornecedoresRes,
        itensVendasRes,
        ultimasVendasRes,
        vendasGraficoRes,
      ] = await Promise.all([
        supabase
          .from("vendas")
          .select("total")
          .eq("status", "finalizada")
          .gte("data_venda", inicioDia)
          .lte("data_venda", fimDia),

        supabase
          .from("vendas")
          .select("total")
          .eq("status", "finalizada")
          .gte("data_venda", inicioMes),

        supabase
          .from("produtos")
          .select("estoque_atual, estoque_minimo")
          .eq("ativo", true),

        supabase.from("clientes").select("*", { count: "exact", head: true }),

        supabase.from("fornecedores").select("*", { count: "exact", head: true }),

        supabase
          .from("vendas_itens")
          .select(`quantidade, produtos:produto_id (nome, preco_venda)`),

        supabase
          .from("vendas")
          .select(`id, total, data_venda, clientes:cliente_id (nome)`)
          .eq("status", "finalizada")
          .order("data_venda", { ascending: false })
          .limit(5),

        supabase
          .from("vendas")
          .select("data_venda, total")
          .eq("status", "finalizada")
          .gte(
            "data_venda",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order("data_venda"),
      ]);

      // ===== Estatísticas =====
      const vendasHoje = vendasHojeRes.data?.length || 0;
      const faturamentoHoje =
        vendasHojeRes.data?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

      const faturamentoMes =
        vendasMesRes.data?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

      const produtos = produtosRes.data ?? [];
      const produtosEstoque = produtos.length;
      const produtosBaixoEstoque = produtos.filter(
        (p) => p.estoque_atual <= p.estoque_minimo
      ).length;

      const totalClientes = clientesRes.count || 0;
      const totalFornecedores = fornecedoresRes.count || 0;

      // ===== Top produtos =====
      const itensVendas = itensVendasRes.data ?? [];
      const produtosAgrupados = itensVendas.reduce<Record<string, Produto>>(
        (acc, item) => {
          const nome = item.produtos?.nome || "Desconhecido";
          if (!acc[nome]) {
            acc[nome] = {
              nome,
              quantidade: 0,
              valor: item.produtos?.preco_venda || 0,
            };
          }
          acc[nome].quantidade += item.quantidade;
          return acc;
        },
        {}
      );

      const topProdutos = Object.values(produtosAgrupados)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // ===== Últimas vendas =====
      const ultimasVendas = (ultimasVendasRes.data ?? []).map((v) => ({
        ...v,
        id: Number(v.id),
      }));

      // ===== Gráfico =====
      const vendasGrafico = vendasGraficoRes.data ?? [];
      const graficoVendas = vendasGrafico.reduce<GraficoVenda[]>(
        (acc, venda) => {
          const data = new Date(venda.data_venda).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
          const existente = acc.find((i) => i.data === data);
          if (existente) {
            existente.valor += Number(venda.total);
          } else {
            acc.push({ data, valor: Number(venda.total) });
          }
          return acc;
        },
        []
      );

      // ===== Atualiza o estado =====
      setStats({
        vendasHoje,
        faturamentoHoje,
        faturamentoMes,
        produtosEstoque,
        produtosBaixoEstoque,
        totalClientes,
        totalFornecedores,
      });
      setTopProdutos(topProdutos);
      setUltimasVendas(ultimasVendas);
      setGraficoVendas(graficoVendas);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string): string =>
    new Date(date).toLocaleString("pt-BR", {
>>>>>>> 327c551 (Subindo correções iniciais)
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
<<<<<<< HEAD
  };

  return (
    <div className="space-y-6">
=======

  // =====================
  // Renderização JSX
  // =====================
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
>>>>>>> 327c551 (Subindo correções iniciais)
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/pdv")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
          <Button variant="outline" onClick={() => navigate("/produtos")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
          <Button variant="outline" onClick={() => navigate("/relatorios")}>
            <FileText className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Hoje
            </CardTitle>
=======
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
>>>>>>> 327c551 (Subindo correções iniciais)
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.faturamentoHoje)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.vendasHoje} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
<<<<<<< HEAD
            <CardTitle className="text-sm font-medium">
              Faturamento Mensal
            </CardTitle>
=======
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
>>>>>>> 327c551 (Subindo correções iniciais)
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.faturamentoMes)}
            </div>
<<<<<<< HEAD
            <p className="text-xs text-muted-foreground">
              Total do mês atual
            </p>
=======
            <p className="text-xs text-muted-foreground">Total do mês atual</p>
>>>>>>> 327c551 (Subindo correções iniciais)
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
<<<<<<< HEAD
            <CardTitle className="text-sm font-medium">
              Produtos Ativos
            </CardTitle>
=======
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
>>>>>>> 327c551 (Subindo correções iniciais)
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produtosEstoque}</div>
            <p className="text-xs text-muted-foreground">
              {stats.produtosBaixoEstoque} com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
<<<<<<< HEAD
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
=======
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
>>>>>>> 327c551 (Subindo correções iniciais)
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFornecedores} fornecedores
            </p>
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
      {/* Gráfico de Vendas */}
=======
      {/* Gráfico */}
>>>>>>> 327c551 (Subindo correções iniciais)
      <Card>
        <CardHeader>
          <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {graficoVendas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={graficoVendas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
<<<<<<< HEAD
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--primary))" 
=======
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
>>>>>>> 327c551 (Subindo correções iniciais)
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda registrada nos últimos 30 dias
            </p>
          )}
        </CardContent>
      </Card>

<<<<<<< HEAD
=======
      {/* Tabelas */}
>>>>>>> 327c551 (Subindo correções iniciais)
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top 5 Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProdutos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda registrada ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
                  {topProdutos.map((produto: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell className="text-right">{produto.quantidade}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(produto.valor)}
=======
                  {topProdutos.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-right">{p.quantidade}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.valor)}
>>>>>>> 327c551 (Subindo correções iniciais)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Últimas Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimasVendas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda registrada ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
                  {ultimasVendas.map((venda: any) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">
                        {venda.clientes?.nome || "Anônimo"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(venda.data_venda)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(venda.total)}
=======
                  {ultimasVendas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {v.clientes?.nome || "Anônimo"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(v.data_venda)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(v.total)}
>>>>>>> 327c551 (Subindo correções iniciais)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
=======
      {/* Alerta de estoque */}
>>>>>>> 327c551 (Subindo correções iniciais)
      {stats.produtosBaixoEstoque > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
<<<<<<< HEAD
              Você tem <strong>{stats.produtosBaixoEstoque} produto(s)</strong> com estoque
              abaixo do mínimo. Acesse a página de <strong>Produtos</strong> para visualizar
              e tomar ações necessárias.
=======
              Você tem{" "}
              <strong>{stats.produtosBaixoEstoque} produto(s)</strong> com estoque
              abaixo do mínimo. Acesse a página de <strong>Produtos</strong> para
              visualizar e tomar ações necessárias.
>>>>>>> 327c551 (Subindo correções iniciais)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

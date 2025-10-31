import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar } from "lucide-react";

export default function Relatorios() {
  const { toast } = useToast();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorioVendas, setRelatorioVendas] = useState<any[]>([]);
  const [relatorioProdutos, setRelatorioProdutos] = useState<any[]>([]);
  const [relatorioEstoque, setRelatorioEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setDataInicio(primeiroDiaMes.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  }, []);

  const gerarRelatorioVendas = async () => {
    if (!dataInicio || !dataFim) {
      toast({ title: "Selecione o período", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          *,
          clientes:cliente_id (nome)
        `)
        .gte("data_venda", `${dataInicio}T00:00:00`)
        .lte("data_venda", `${dataFim}T23:59:59`)
        .order("data_venda", { ascending: false });

      if (error) throw error;

      setRelatorioVendas(data || []);
      toast({ title: "Relatório gerado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioProdutos = async () => {
    setLoading(true);

    try {
      const { data: itensVendas, error } = await supabase
        .from("vendas_itens")
        .select(`
          quantidade,
          preco_unitario,
          subtotal,
          produtos:produto_id (nome, preco_venda)
        `);

      if (error) throw error;

      const produtosAgrupados = itensVendas?.reduce((acc: any, item: any) => {
        const produtoNome = item.produtos?.nome || "Desconhecido";
        if (!acc[produtoNome]) {
          acc[produtoNome] = {
            nome: produtoNome,
            quantidade: 0,
            total: 0,
            precoMedio: 0,
          };
        }
        acc[produtoNome].quantidade += item.quantidade;
        acc[produtoNome].total += item.subtotal;
        return acc;
      }, {});

      const resultado = Object.values(produtosAgrupados || {})
        .map((p: any) => ({
          ...p,
          precoMedio: p.total / p.quantidade,
        }))
        .sort((a: any, b: any) => b.quantidade - a.quantidade);

      setRelatorioProdutos(resultado as any);
      toast({ title: "Relatório gerado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioEstoque = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("nome, estoque_atual, estoque_minimo, preco_venda, custo")
        .eq("ativo", true)
        .order("estoque_atual");

      if (error) throw error;

      setRelatorioEstoque(data || []);
      toast({ title: "Relatório gerado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportarCSV = (dados: any[], nome: string) => {
    if (dados.length === 0) {
      toast({ title: "Não há dados para exportar", variant: "destructive" });
      return;
    }

    const headers = Object.keys(dados[0]).join(",");
    const rows = dados.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({ title: "Relatório exportado com sucesso!" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios detalhados do sistema</p>
      </div>

      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Vendas por Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={gerarRelatorioVendas} disabled={loading}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Gerar
                  </Button>
                  {relatorioVendas.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => exportarCSV(relatorioVendas, "relatorio_vendas")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  )}
                </div>
              </div>

              {relatorioVendas.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Venda</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioVendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell className="font-medium">{venda.numero_venda}</TableCell>
                        <TableCell>{formatDate(venda.data_venda)}</TableCell>
                        <TableCell>{venda.clientes?.nome || "Anônimo"}</TableCell>
                        <TableCell>{venda.forma_pagamento}</TableCell>
                        <TableCell className="font-bold text-success">
                          {formatCurrency(venda.total)}
                        </TableCell>
                        <TableCell>{venda.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Produtos Mais Vendidos
                </span>
                <div className="flex gap-2">
                  <Button onClick={gerarRelatorioProdutos} disabled={loading}>
                    Gerar
                  </Button>
                  {relatorioProdutos.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => exportarCSV(relatorioProdutos, "produtos_mais_vendidos")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatorioProdutos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade Vendida</TableHead>
                      <TableHead className="text-right">Preço Médio</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioProdutos.map((produto, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell className="text-right">{produto.quantidade}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(produto.precoMedio)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-success">
                          {formatCurrency(produto.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Clique em "Gerar" para visualizar o relatório
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório de Estoque
                </span>
                <div className="flex gap-2">
                  <Button onClick={gerarRelatorioEstoque} disabled={loading}>
                    Gerar
                  </Button>
                  {relatorioEstoque.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => exportarCSV(relatorioEstoque, "relatorio_estoque")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatorioEstoque.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Estoque Atual</TableHead>
                      <TableHead className="text-right">Estoque Mínimo</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Preço Venda</TableHead>
                      <TableHead className="text-right">Total em Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioEstoque.map((produto, idx) => (
                      <TableRow key={idx} className={produto.estoque_atual <= produto.estoque_minimo ? "bg-warning-light" : ""}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell className="text-right">{produto.estoque_atual}</TableCell>
                        <TableCell className="text-right">{produto.estoque_minimo}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(produto.custo)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(produto.preco_venda)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(produto.estoque_atual * produto.custo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Clique em "Gerar" para visualizar o relatório
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
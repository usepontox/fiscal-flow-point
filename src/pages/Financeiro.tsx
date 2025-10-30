import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  categoria?: string;
}

export default function Financeiro() {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalReceber: 0,
    totalPagar: 0,
    receberVencido: 0,
    pagarVencido: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: receber, error: erroReceber } = await supabase
      .from("contas_receber")
      .select("*")
      .order("data_vencimento");

    const { data: pagar, error: erroPagar } = await supabase
      .from("contas_pagar")
      .select("*")
      .order("data_vencimento");

    if (erroReceber || erroPagar) {
      toast({
        title: "Erro ao carregar dados financeiros",
        description: erroReceber?.message || erroPagar?.message,
        variant: "destructive",
      });
    } else {
      setContasReceber(receber || []);
      setContasPagar(pagar || []);

      const hoje = new Date().toISOString().split("T")[0];

      setStats({
        totalReceber: (receber || []).filter((c) => c.status === "pendente").reduce((acc, c) => acc + Number(c.valor), 0),
        totalPagar: (pagar || []).filter((c) => c.status === "pendente").reduce((acc, c) => acc + Number(c.valor), 0),
        receberVencido: (receber || []).filter((c) => c.status === "pendente" && c.data_vencimento < hoje).length,
        pagarVencido: (pagar || []).filter((c) => c.status === "pendente" && c.data_vencimento < hoje).length,
      });
    }
  };

  const marcarComoPago = async (id: string, tipo: "receber" | "pagar") => {
    const tabela = tipo === "receber" ? "contas_receber" : "contas_pagar";

    const { error } = await supabase
      .from(tabela)
      .update({ status: "pago", data_pagamento: new Date().toISOString().split("T")[0] })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta marcada como paga!" });
      carregarDados();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string, dataVencimento: string) => {
    if (status === "pago") {
      return <Badge variant="default" className="bg-success">Pago</Badge>;
    }

    const hoje = new Date().toISOString().split("T")[0];
    if (dataVencimento < hoje) {
      return <Badge variant="destructive">Vencido</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Gerencie contas a pagar e receber</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReceber)}</div>
            <p className="text-xs text-muted-foreground">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPagar)}</div>
            <p className="text-xs text-muted-foreground">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos (Receber)</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receberVencido}</div>
            <p className="text-xs text-muted-foreground">Contas vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos (Pagar)</CardTitle>
            <Calendar className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pagarVencido}</div>
            <p className="text-xs text-muted-foreground">Contas vencidas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Valores a serem recebidos de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasReceber.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell>{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                      <TableCell>{conta.data_pagamento ? formatDate(conta.data_pagamento) : "-"}</TableCell>
                      <TableCell>{getStatusBadge(conta.status, conta.data_vencimento)}</TableCell>
                      <TableCell className="text-right">
                        {conta.status === "pendente" && (
                          <Button
                            size="sm"
                            onClick={() => marcarComoPago(conta.id, "receber")}
                          >
                            Marcar como Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Valores a serem pagos a fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagar.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell>{conta.categoria || "-"}</TableCell>
                      <TableCell>{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                      <TableCell>{conta.data_pagamento ? formatDate(conta.data_pagamento) : "-"}</TableCell>
                      <TableCell>{getStatusBadge(conta.status, conta.data_vencimento)}</TableCell>
                      <TableCell className="text-right">
                        {conta.status === "pendente" && (
                          <Button
                            size="sm"
                            onClick={() => marcarComoPago(conta.id, "pagar")}
                          >
                            Marcar como Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

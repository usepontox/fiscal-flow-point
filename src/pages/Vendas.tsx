import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Receipt, X } from "lucide-react";
import CupomFiscal from "@/components/CupomFiscal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Venda {
  id: string;
  numero_venda: string;
  data_venda: string;
  total: number;
  forma_pagamento: string;
  status: string;
  clientes?: { nome: string } | null;
}

export default function Vendas() {
  const { toast } = useToast();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [busca, setBusca] = useState("");
  const [cupomVendaId, setCupomVendaId] = useState<string | null>(null);
  const [cupomOpen, setCupomOpen] = useState(false);
  const [vendaCancelarId, setVendaCancelarId] = useState<string | null>(null);

  useEffect(() => {
    loadVendas();
  }, []);

  const loadVendas = async () => {
    const { data, error } = await supabase
      .from("vendas")
      .select(`
        *,
        clientes:cliente_id (nome)
      `)
      .order("data_venda", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar vendas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setVendas(data as any || []);
    }
  };

  const cancelarVenda = async () => {
    if (!vendaCancelarId) return;

    const { error } = await supabase
      .from("vendas")
      .update({ status: "cancelada" })
      .eq("id", vendaCancelarId);

    if (error) {
      toast({
        title: "Erro ao cancelar venda",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Venda cancelada com sucesso!" });
      loadVendas();
    }
    
    setVendaCancelarId(null);
  };

  const visualizarCupom = (vendaId: string) => {
    setCupomVendaId(vendaId);
    setCupomOpen(true);
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

  const vendasFiltradas = vendas.filter(
    (v) =>
      v.numero_venda.toLowerCase().includes(busca.toLowerCase()) ||
      v.clientes?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendas</h1>
        <p className="text-muted-foreground">Histórico completo de vendas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número da venda ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasFiltradas.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-medium">{venda.numero_venda}</TableCell>
                  <TableCell>{venda.clientes?.nome || "Anônimo"}</TableCell>
                  <TableCell>{formatDate(venda.data_venda)}</TableCell>
                  <TableCell className="font-bold text-success">
                    {formatCurrency(venda.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{venda.forma_pagamento.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        venda.status === "finalizada"
                          ? "default"
                          : venda.status === "cancelada"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {venda.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => visualizarCupom(venda.id)}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Cupom
                      </Button>
                      {venda.status === "finalizada" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVendaCancelarId(venda.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CupomFiscal
        vendaId={cupomVendaId}
        open={cupomOpen}
        onOpenChange={setCupomOpen}
      />

      <AlertDialog open={!!vendaCancelarId} onOpenChange={() => setVendaCancelarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.
              O estoque NÃO será automaticamente restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={cancelarVenda}>
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

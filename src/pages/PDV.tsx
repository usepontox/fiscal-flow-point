import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Clock } from "lucide-react";
import CupomFiscal from "@/components/CupomFiscal";

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  estoque_atual: number;
}

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

interface VendaRecente {
  id: string;
  numero_venda: string;
  data_venda: string;
  total: number;
  forma_pagamento: string;
  status: string;
}

export default function PDV() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [loading, setLoading] = useState(false);
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [cupomVendaId, setCupomVendaId] = useState<string | null>(null);
  const [cupomOpen, setCupomOpen] = useState(false);

  useEffect(() => {
    loadProdutos();
    loadVendasRecentes();
  }, []);

  const loadProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, preco_venda, estoque_atual")
      .eq("ativo", true)
      .gt("estoque_atual", 0);

    if (data) setProdutos(data);
  };

  const loadVendasRecentes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("vendas")
      .select("id, numero_venda, data_venda, total, forma_pagamento, status")
      .eq("operador_id", user.id)
      .order("data_venda", { ascending: false })
      .limit(10);

    if (data) setVendasRecentes(data);
  };

  const visualizarCupom = (vendaId: string) => {
    setCupomVendaId(vendaId);
    setCupomOpen(true);
  };

  const adicionarProduto = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);

    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque_atual) {
        toast({
          title: "Estoque insuficiente",
          variant: "destructive",
        });
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * produto.preco_venda }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto,
        quantidade: 1,
        subtotal: produto.preco_venda,
      }]);
    }
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.produto.id === produtoId) {
        const novaQuantidade = item.quantidade + delta;
        if (novaQuantidade <= 0) return item;
        if (novaQuantidade > item.produto.estoque_atual) {
          toast({ title: "Estoque insuficiente", variant: "destructive" });
          return item;
        }
        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: novaQuantidade * item.produto.preco_venda,
        };
      }
      return item;
    }));
  };

  const removerItem = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const calcularTotal = () => {
    return carrinho.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const total = calcularTotal();

      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from("vendas")
        .insert({
          operador_id: user.id,
          numero_venda: `VENDA-${Date.now()}`,
          subtotal: total,
          desconto: 0,
          total,
          forma_pagamento: formaPagamento,
          status: "finalizada",
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Criar itens da venda
      const itens = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco_venda,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase
        .from("vendas_itens")
        .insert(itens);

      if (itensError) throw itensError;

      toast({
        title: "Venda finalizada!",
        description: `Total: ${formatCurrency(total)}`,
      });

      // Mostrar cupom automaticamente
      setCupomVendaId(venda.id);
      setCupomOpen(true);

      setCarrinho([]);
      loadProdutos();
      loadVendasRecentes();
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar venda",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PDV / Caixa</h1>
        <p className="text-muted-foreground">Sistema de Ponto de Venda</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Produtos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto space-y-2">
              {produtosFiltrados.map(produto => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => adicionarProduto(produto)}
                >
                  <div>
                    <p className="font-medium">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {produto.estoque_atual}
                    </p>
                  </div>
                  <p className="font-bold text-success">
                    {formatCurrency(produto.preco_venda)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrinho.map(item => (
                    <TableRow key={item.produto.id}>
                      <TableCell className="font-medium">
                        {item.produto.nome}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => alterarQuantidade(item.produto.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantidade}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => alterarQuantidade(item.produto.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => removerItem(item.produto.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="fiado">Fiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-success">{formatCurrency(calcularTotal())}</span>
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={finalizarVenda}
                disabled={loading || carrinho.length === 0}
              >
                Finalizar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Venda</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasRecentes.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-medium">{venda.numero_venda}</TableCell>
                  <TableCell>{formatDate(venda.data_venda)}</TableCell>
                  <TableCell className="font-bold text-success">
                    {formatCurrency(venda.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{venda.forma_pagamento.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={venda.status === "finalizada" ? "default" : "secondary"}>
                      {venda.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => visualizarCupom(venda.id)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Cupom
                    </Button>
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
    </div>
  );
}

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
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Clock, Edit2, DollarSign } from "lucide-react";
import CupomFiscal from "@/components/CupomFiscal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InputMask from "react-input-mask";
import { masks } from "@/lib/masks";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  estoque_atual: number;
  codigo_barras?: string;
  sku?: string;
  ncm?: string;
}

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
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

interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  cnpj?: string;
}

export default function PDV() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [clienteId, setClienteId] = useState<string>("anonimo");
  const [cpfNota, setCpfNota] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [loading, setLoading] = useState(false);
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [cupomVendaId, setCupomVendaId] = useState<string | null>(null);
  const [cupomOpen, setCupomOpen] = useState(false);
  
  // Produto manual
  const [produtoManualOpen, setProdutoManualOpen] = useState(false);
  const [produtoManual, setProdutoManual] = useState({ nome: "", preco: "", quantidade: "1" });
  
  // Editar preço
  const [editandoPreco, setEditandoPreco] = useState<{ id: string; preco: string } | null>(null);

  useEffect(() => {
    loadProdutos();
    loadClientes();
    loadVendasRecentes();
  }, []);

  const loadProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, preco_venda, estoque_atual, codigo_barras, sku, ncm")
      .eq("ativo", true);

    if (data) setProdutos(data);
  };

  const loadClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, cpf, cnpj")
      .order("nome");

    if (data) setClientes(data);
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
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? { 
              ...item, 
              quantidade: item.quantidade + 1, 
              subtotal: (item.quantidade + 1) * item.preco_unitario 
            }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        subtotal: produto.preco_venda,
      }]);
    }
  };

  const adicionarProdutoManual = () => {
    if (!produtoManual.nome || !produtoManual.preco || !produtoManual.quantidade) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const preco = parseFloat(produtoManual.preco);
    const quantidade = parseInt(produtoManual.quantidade);

    if (isNaN(preco) || isNaN(quantidade) || preco <= 0 || quantidade <= 0) {
      toast({ title: "Valores inválidos", variant: "destructive" });
      return;
    }

    const produtoTemp: Produto = {
      id: `manual-${Date.now()}`,
      nome: produtoManual.nome,
      preco_venda: preco,
      estoque_atual: 9999,
    };

    setCarrinho([...carrinho, {
      produto: produtoTemp,
      quantidade,
      preco_unitario: preco,
      subtotal: preco * quantidade,
    }]);

    setProdutoManual({ nome: "", preco: "", quantidade: "1" });
    setProdutoManualOpen(false);
    toast({ title: "Produto adicionado ao carrinho!" });
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.produto.id === produtoId) {
        const novaQuantidade = item.quantidade + delta;
        if (novaQuantidade <= 0) return item;
        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: novaQuantidade * item.preco_unitario,
        };
      }
      return item;
    }));
  };

  const alterarPreco = (produtoId: string) => {
    const item = carrinho.find(i => i.produto.id === produtoId);
    if (item) {
      setEditandoPreco({ id: produtoId, preco: item.preco_unitario.toString() });
    }
  };

  const salvarPreco = () => {
    if (!editandoPreco) return;

    const novoPreco = parseFloat(editandoPreco.preco);
    if (isNaN(novoPreco) || novoPreco <= 0) {
      toast({ title: "Preço inválido", variant: "destructive" });
      return;
    }

    setCarrinho(carrinho.map(item =>
      item.produto.id === editandoPreco.id
        ? { 
            ...item, 
            preco_unitario: novoPreco, 
            subtotal: item.quantidade * novoPreco 
          }
        : item
    ));

    setEditandoPreco(null);
    toast({ title: "Preço atualizado!" });
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
          cliente_id: clienteId === "anonimo" ? null : clienteId,
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

      // Criar itens da venda (apenas para produtos reais, não manuais)
      const itensReais = carrinho.filter(item => !item.produto.id.startsWith("manual-"));
      if (itensReais.length > 0) {
        const itens = itensReais.map(item => ({
          venda_id: venda.id,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
        }));

        const { error: itensError } = await supabase
          .from("vendas_itens")
          .insert(itens);

        if (itensError) throw itensError;
      }

      toast({
        title: "Venda finalizada!",
        description: `Total: ${formatCurrency(total)}${cpfNota ? ` - CPF: ${cpfNota}` : ""}`,
      });

      // Mostrar cupom automaticamente
      setCupomVendaId(venda.id);
      setCupomOpen(true);

      setCarrinho([]);
      setClienteId("anonimo");
      setCpfNota("");
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
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_barras?.toLowerCase().includes(busca.toLowerCase()) ||
    p.sku?.toLowerCase().includes(busca.toLowerCase())
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

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Produtos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Produtos</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setProdutoManualOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Produto Manual
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[calc(100vh-280px)] overflow-auto space-y-2">
              {produtosFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado
                </p>
              ) : (
                produtosFiltrados.map(produto => (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => adicionarProduto(produto)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {produto.estoque_atual} unidades
                      </p>
                    </div>
                    <p className="font-bold text-lg text-success ml-4">
                      {formatCurrency(produto.preco_venda)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Cliente */}
            <div>
              <Label className="text-xs">Cliente (opcional)</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Venda Anônima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonimo">Venda Anônima</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CPF/CNPJ do Cliente */}
            {clienteId !== "anonimo" && (
              <div>
                <Label className="text-xs">CPF/CNPJ do Cliente</Label>
                <Input 
                  value={
                    clientes.find(c => c.id === clienteId)?.cpf || 
                    clientes.find(c => c.id === clienteId)?.cnpj || 
                    ""
                  }
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
            )}
            
            {/* CPF na Nota (quando anônimo) */}
            {clienteId === "anonimo" && (
              <div>
                <Label className="text-xs">CPF na Nota (opcional)</Label>
                <InputMask
                  mask={masks.cpf}
                  value={cpfNota}
                  onChange={(e) => setCpfNota(e.target.value)}
                >
                  {(inputProps: any) => (
                    <Input {...inputProps} placeholder="000.000.000-00" className="mt-1" />
                  )}
                </InputMask>
              </div>
            )}

            {/* Itens do Carrinho */}
            <div className="border rounded-lg">
              <div className="max-h-[calc(100vh-600px)] min-h-[150px] overflow-auto">
                {carrinho.length === 0 ? (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
                    Carrinho vazio
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-center w-24">Qtd</TableHead>
                        <TableHead className="text-xs text-right w-24">Preço</TableHead>
                        <TableHead className="text-xs text-right w-20">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carrinho.map(item => (
                        <TableRow key={item.produto.id}>
                          <TableCell className="text-xs font-medium py-2">
                            {item.produto.nome}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center justify-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-6 w-6"
                                      onClick={() => alterarQuantidade(item.produto.id, -1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Diminuir quantidade</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span className="w-6 text-center text-xs">{item.quantidade}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-6 w-6"
                                      onClick={() => alterarQuantidade(item.produto.id, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Aumentar quantidade</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-right py-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 mr-1"
                                    onClick={() => alterarPreco(item.produto.id)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Alterar preço</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {formatCurrency(item.preco_unitario)}
                          </TableCell>
                          <TableCell className="text-xs text-right py-2 font-semibold">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                          <TableCell className="py-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => removerItem(item.produto.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover item</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Pagamento e Total */}
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                    <SelectItem value="debito">💳 Débito</SelectItem>
                    <SelectItem value="credito">💳 Crédito</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="fiado">📝 Fiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-2xl font-bold py-2">
                <span>Total:</span>
                <span className="text-success">{formatCurrency(calcularTotal())}</span>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={finalizarVenda}
                disabled={loading || carrinho.length === 0}
              >
                {loading ? "Processando..." : "Finalizar Venda"}
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

      {/* Dialog Produto Manual */}
      <Dialog open={produtoManualOpen} onOpenChange={setProdutoManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Produto</Label>
              <Input
                value={produtoManual.nome}
                onChange={(e) => setProdutoManual({ ...produtoManual, nome: e.target.value })}
                placeholder="Ex: Produto Avulso"
              />
            </div>
            <div>
              <Label>Preço Unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={produtoManual.preco}
                onChange={(e) => setProdutoManual({ ...produtoManual, preco: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={produtoManual.quantidade}
                onChange={(e) => setProdutoManual({ ...produtoManual, quantidade: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProdutoManualOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={adicionarProdutoManual} className="flex-1">
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Preço */}
      <Dialog open={editandoPreco !== null} onOpenChange={(open) => !open && setEditandoPreco(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Preço do Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Preço Unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editandoPreco?.preco || ""}
                onChange={(e) => editandoPreco && setEditandoPreco({ ...editandoPreco, preco: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditandoPreco(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={salvarPreco} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CupomFiscal
        vendaId={cupomVendaId}
        open={cupomOpen}
        onOpenChange={setCupomOpen}
      />
    </div>
  );
}

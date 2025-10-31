import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Package, Search, FileText, Upload } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import xml2js from "xml2js";

interface Produto {
  id: string;
  nome: string;
  custo: number;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface ItemCompra {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export default function Compras() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState("");
  
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [numeroNota, setNumeroNota] = useState("");
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProdutos();
    loadFornecedores();
  }, []);

  const loadProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, custo")
      .eq("ativo", true);
    
    if (data) setProdutos(data);
  };

  const loadFornecedores = async () => {
    const { data } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .order("nome");
    
    if (data) setFornecedores(data);
  };

  const handleImportarXML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(text);
      
      // Extrair dados da nota fiscal (estrutura padrão NFe)
      const nfe = result.nfeProc?.NFe?.infNFe || result.NFe?.infNFe;
      
      if (!nfe) {
        toast({ title: "XML inválido", description: "Estrutura de NFe não encontrada", variant: "destructive" });
        return;
      }

      // Extrair número da nota
      setNumeroNota(nfe.ide?.nNF || "");

      // Processar itens da nota
      const itensNF = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
      const itensImportados: ItemCompra[] = [];

      for (const item of itensNF) {
        const prod = item.prod;
        const nomeProduto = prod.xProd;
        const quantidade = parseFloat(prod.qCom);
        const precoUnitario = parseFloat(prod.vUnCom);

        // Buscar produto existente ou criar placeholder
        const produtoExistente = produtos.find(p => 
          p.nome.toLowerCase() === nomeProduto.toLowerCase()
        );

        const produto: Produto = produtoExistente || {
          id: `temp-${Date.now()}-${Math.random()}`,
          nome: nomeProduto,
          custo: precoUnitario
        };

        itensImportados.push({
          produto,
          quantidade,
          preco_unitario: precoUnitario,
          subtotal: quantidade * precoUnitario
        });
      }

      setItens(itensImportados);
      toast({ 
        title: "XML importado com sucesso!", 
        description: `${itensImportados.length} itens carregados`
      });
      
    } catch (error: any) {
      toast({ 
        title: "Erro ao processar XML", 
        description: error.message, 
        variant: "destructive" 
      });
    }

    e.target.value = '';
  };

  const adicionarItem = (produto: Produto) => {
    const itemExistente = itens.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setItens(itens.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario }
          : item
      ));
    } else {
      setItens([...itens, {
        produto,
        quantidade: 1,
        preco_unitario: produto.custo,
        subtotal: produto.custo,
      }]);
    }
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setItens(itens.map(item => {
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

  const alterarPreco = (produtoId: string, preco: number) => {
    setItens(itens.map(item => {
      if (item.produto.id === produtoId) {
        return {
          ...item,
          preco_unitario: preco,
          subtotal: item.quantidade * preco,
        };
      }
      return item;
    }));
  };

  const removerItem = (produtoId: string) => {
    setItens(itens.filter(item => item.produto.id !== produtoId));
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const finalizarCompra = async () => {
    if (itens.length === 0) {
      toast({ title: "Adicione produtos à compra", variant: "destructive" });
      return;
    }

    if (!numeroNota) {
      toast({ title: "Informe o número da nota", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const total = calcularTotal();

      // Criar compra
      const { data: compra, error: compraError } = await supabase
        .from("compras")
        .insert({
          fornecedor_id: fornecedorId || null,
          numero_nota: numeroNota,
          valor_total: total,
          usuario_id: user.id,
        })
        .select()
        .single();

      if (compraError) throw compraError;

      // Criar itens da compra (apenas produtos reais)
      const itensReais = itens.filter(item => !item.produto.id.startsWith("temp-"));
      if (itensReais.length > 0) {
        const itensCompra = itensReais.map(item => ({
          compra_id: compra.id,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
        }));

        const { error: itensError } = await supabase
          .from("compras_itens")
          .insert(itensCompra);

        if (itensError) throw itensError;
      }

      toast({
        title: "Compra registrada com sucesso!",
        description: `Total: ${formatCurrency(total)}`,
      });

      // Limpar formulário
      setItens([]);
      setFornecedorId("");
      setNumeroNota("");
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar compra",
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

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compras / Entradas</h1>
          <p className="text-muted-foreground">Registre entrada de produtos no estoque</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Nova Compra
              </Button>
            </TooltipTrigger>
            <TooltipContent>Registrar nova entrada de produtos</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Compra / Entrada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fornecedor (opcional)</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número da Nota *</Label>
                <Input
                  value={numeroNota}
                  onChange={(e) => setNumeroNota(e.target.value)}
                  placeholder="Ex: 123456"
                />
              </div>
              <div>
                <Label>Importar XML NFe</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => document.getElementById('xml-upload')?.click()}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Carregar XML
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Importar produtos de nota fiscal eletrônica (XML)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  id="xml-upload"
                  type="file"
                  accept=".xml"
                  onChange={handleImportarXML}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Produtos Disponíveis</CardTitle>
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
                <CardContent className="max-h-[400px] overflow-auto">
                  {produtosFiltrados.map(produto => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-2 border rounded mb-2 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => adicionarItem(produto)}
                    >
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Custo: {formatCurrency(produto.custo)}
                        </p>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Itens da Compra</span>
                    {itens.length > 0 && (
                      <Badge variant="secondary">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-auto">
                  {itens.length === 0 ? (
                    <div className="text-center py-12">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Adicione produtos ou importe XML
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-24">Qtd</TableHead>
                          <TableHead className="w-32">Preço</TableHead>
                          <TableHead className="w-24">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map(item => (
                          <TableRow key={item.produto.id}>
                            <TableCell className="text-xs">
                              {item.produto.nome}
                              {item.produto.id.startsWith("temp-") && (
                                <Badge variant="outline" className="ml-2 bg-yellow-100 text-xs">
                                  Novo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => alterarQuantidade(item.produto.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-xs">{item.quantidade}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => alterarQuantidade(item.produto.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.preco_unitario}
                                onChange={(e) => alterarPreco(item.produto.id, parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-xs font-semibold">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                            <TableCell>
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
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-2xl font-bold">
                Total: {formatCurrency(calcularTotal())}
              </div>
              <Button
                onClick={finalizarCompra}
                disabled={loading || itens.length === 0}
                size="lg"
              >
                {loading ? "Processando..." : "Finalizar Compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

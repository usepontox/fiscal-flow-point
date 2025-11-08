import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertTriangle, Edit, Trash2, Upload } from "lucide-react";
import ProdutoForm from "@/components/ProdutoForm";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEmpresa } from "@/hooks/use-empresa";

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const { toast } = useToast();
  const { empresaId } = useEmpresa();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dadosImportacao, setDadosImportacao] = useState<any[]>([]);

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .order("nome");
    if (data) setProdutos(data);
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEditar = (produto: any) => {
    setProdutoEditando(produto);
    setDialogOpen(true);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar produto",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Produto deletado com sucesso!" });
      loadProdutos();
    }
  };

  const handleNovoClick = () => {
    setProdutoEditando(null);
    setDialogOpen(true);
  };

  const handleImportarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast({ title: "Arquivo vazio", variant: "destructive" });
          return;
        }

        // Validar colunas obrigatórias
        const primeiraLinha = jsonData[0];
        const colunasNecessarias = ['nome', 'preco_venda', 'custo', 'estoque_atual'];
        const colunasFaltando = colunasNecessarias.filter(col => 
          !Object.keys(primeiraLinha).some(key => key.toLowerCase() === col)
        );

        if (colunasFaltando.length > 0) {
          toast({ 
            title: "Colunas obrigatórias faltando", 
            description: `Faltam: ${colunasFaltando.join(', ')}`,
            variant: "destructive" 
          });
          return;
        }

        // Normalizar nomes de colunas
        const dadosNormalizados = jsonData.map(item => {
          const normalizado: any = {};
          Object.keys(item).forEach(key => {
            const keyNormalizada = key.toLowerCase().trim();
            normalizado[keyNormalizada] = item[key];
          });
          return normalizado;
        });

        setDadosImportacao(dadosNormalizados);
        setImportDialogOpen(true);
      } catch (error) {
        toast({ title: "Erro ao ler arquivo", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const confirmarImportacao = async () => {
    try {
      if (!empresaId) {
        toast({ title: "Erro", description: "Empresa não identificada", variant: "destructive" });
        return;
      }

      const produtosParaInserir = dadosImportacao.map(item => ({
        nome: item.nome,
        preco_venda: parseFloat(item.preco_venda) || 0,
        custo: parseFloat(item.custo) || 0,
        estoque_atual: parseInt(item.estoque_atual) || 0,
        estoque_minimo: parseInt(item.estoque_minimo) || 0,
        descricao: item.descricao || null,
        codigo_barras: item.codigo_barras || null,
        sku: item.sku || null,
        ativo: true,
        empresa_id: empresaId,
      }));

      const { error } = await supabase
        .from('produtos')
        .insert(produtosParaInserir);

      if (error) throw error;

      toast({ title: `${produtosParaInserir.length} produtos importados com sucesso!` });
      setImportDialogOpen(false);
      setDadosImportacao([]);
      loadProdutos();
    } catch (error: any) {
      toast({ 
        title: "Erro ao importar produtos", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gestão de estoque e produtos</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>Importar produtos de planilha Excel</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="gap-2" onClick={handleNovoClick}>
                  <Plus className="h-4 w-4" />
                  Novo Produto
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cadastrar novo produto</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportarExcel}
            className="hidden"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosFiltrados.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{produto.estoque_atual}</span>
                      {produto.estoque_atual <= produto.estoque_minimo && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(produto.custo)}</TableCell>
                  <TableCell className="font-medium text-success">
                    {formatCurrency(produto.preco_venda)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={produto.ativo ? "default" : "secondary"}>
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditar(produto)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar produto</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletar(produto.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir produto</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProdutoForm 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={loadProdutos}
        produtoEditando={produtoEditando}
      />

      {/* Dialog Importação Excel */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Importação</DialogTitle>
            <DialogDescription>
              {dadosImportacao.length} produtos encontrados. Revise antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosImportacao.slice(0, 10).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(item.preco_venda) || 0)}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(item.custo) || 0)}</TableCell>
                    <TableCell>{item.estoque_atual}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {dadosImportacao.length > 10 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                ... e mais {dadosImportacao.length - 10} produtos
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarImportacao}>
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

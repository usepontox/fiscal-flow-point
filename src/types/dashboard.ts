export interface Produto {
  nome: string;
  quantidade: number;
  valor: number;
}

export interface Venda {
  id: number;
  total: number;
  data_venda: string;
  clientes?: {
    nome: string;
  } | null;
}

export interface GraficoVenda {
  data: string;
  valor: number;
}

export interface Stats {
  vendasHoje: number;
  faturamentoHoje: number;
  faturamentoMes: number;
  produtosEstoque: number;
  produtosBaixoEstoque: number;
  totalClientes: number;
  totalFornecedores: number;
}

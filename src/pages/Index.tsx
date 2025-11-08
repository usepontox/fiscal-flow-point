import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Package, 
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "PDV Completo",
      description: "Sistema de ponto de venda rápido e intuitivo para agilizar suas vendas"
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Controle de Estoque",
      description: "Gerencie seu inventário com precisão e receba alertas de estoque baixo"
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Gestão Financeira",
      description: "Acompanhe receitas, despesas e fluxo de caixa em tempo real"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Gestão de Clientes",
      description: "Mantenha cadastro completo de clientes e fornecedores"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Relatórios Detalhados",
      description: "Análises completas para tomada de decisões estratégicas"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Multi-empresa",
      description: "Gerencie múltiplas empresas em uma única plataforma"
    }
  ];

  const benefits = [
    "Interface moderna e intuitiva",
    "Acesso de qualquer dispositivo",
    "Dados seguros na nuvem",
    "Suporte especializado",
    "Atualizações automáticas",
    "Relatórios em tempo real"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">6 - PDV</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default" size="lg">
            Acessar Sistema
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <Badge className="text-sm px-4 py-2" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Sistema Completo de Gestão Comercial
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Controle total do seu
            <span className="text-transparent bg-clip-text bg-gradient-primary"> negócio</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema integrado para gestão de vendas, estoque, financeiro e muito mais. 
            Simplifique sua rotina e tome decisões baseadas em dados reais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button onClick={() => navigate("/auth")} size="lg" className="text-lg h-14 px-8">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/auth")} size="lg" variant="outline" className="text-lg h-14 px-8">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Recursos Essenciais para seu Negócio
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo que você precisa em um só lugar para gerenciar seu comércio com eficiência
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/10"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Por que escolher o 6 - PDV?
              </h2>
              <p className="text-muted-foreground text-lg">
                Uma solução completa e moderna para impulsionar seu negócio com tecnologia de ponta e facilidade de uso.
              </p>
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Segurança Garantida</h3>
                      <p className="text-sm text-muted-foreground">
                        Seus dados protegidos com criptografia e backup automático
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Economia de Tempo</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatize processos e ganhe mais tempo para focar no crescimento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Aumente suas Vendas</h3>
                      <p className="text-sm text-muted-foreground">
                        Ferramentas que ajudam a vender mais e melhor
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-primary text-white border-0 shadow-2xl">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Junte-se a centenas de empresas que já confiam no 6 - PDV para gerenciar suas operações.
            </p>
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              variant="secondary"
              className="text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">6 - PDV</span>
          </div>
          <p>© 2025 6 - PDV. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

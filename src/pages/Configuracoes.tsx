import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save, Building, Palette, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputMask from "react-input-mask";
import { masks } from "@/lib/masks";

export default function Configuracoes() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
  });
  const [senhas, setSenhas] = useState({
    atual: "",
    nova: "",
    confirmar: "",
  });
  const [empresa, setEmpresa] = useState({
    nome_empresa: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    email: "",
  });

  useEffect(() => {
    loadProfile();
    loadEmpresa();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        nome: data.nome || "",
        email: data.email || "",
      });
    }
  };

  const loadEmpresa = async () => {
    const { data } = await supabase
      .from("configuracoes_empresa")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setEmpresa(data);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ nome: profile.nome })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (senhas.nova !== senhas.confirmar) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (senhas.nova.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senhas.nova,
      });

      if (error) throw error;

      toast({ title: "Senha alterada com sucesso!" });
      setSenhas({ atual: "", nova: "", confirmar: "" });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from("configuracoes_empresa")
        .select("id")
        .limit(1)
        .single();

      let error;
      if (existing) {
        const result = await supabase
          .from("configuracoes_empresa")
          .update(empresa)
          .eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("configuracoes_empresa")
          .insert([empresa]);
        error = result.error;
      }

      if (error) throw error;

      toast({ title: "Dados da empresa salvos com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar dados da empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e dados do sistema</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList>
          <TabsTrigger value="perfil">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="empresa">
            <Building className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="aparencia">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="equipamentos">
            <Printer className="h-4 w-4 mr-2" />
            Equipamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={profile.nome}
                    onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    value={senhas.atual}
                    onChange={(e) => setSenhas({ ...senhas, atual: e.target.value })}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha-nova">Nova Senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    value={senhas.nova}
                    onChange={(e) => setSenhas({ ...senhas, nova: e.target.value })}
                    placeholder="Digite a nova senha"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha-confirmar">Confirmar Nova Senha</Label>
                  <Input
                    id="senha-confirmar"
                    type="password"
                    value={senhas.confirmar}
                    onChange={(e) => setSenhas({ ...senhas, confirmar: e.target.value })}
                    placeholder="Confirme a nova senha"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Configure as informações da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEmpresa} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input
                      id="nome_empresa"
                      value={empresa.nome_empresa}
                      onChange={(e) => setEmpresa({ ...empresa, nome_empresa: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <InputMask
                      mask={masks.cnpj}
                      value={empresa.cnpj}
                      onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                    >
                      {(inputProps: any) => <Input {...inputProps} id="cnpj" />}
                    </InputMask>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_empresa">Telefone</Label>
                    <InputMask
                      mask={masks.telefone}
                      value={empresa.telefone}
                      onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                    >
                      {(inputProps: any) => <Input {...inputProps} id="telefone_empresa" />}
                    </InputMask>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email_empresa">E-mail</Label>
                    <Input
                      id="email_empresa"
                      type="email"
                      value={empresa.email}
                      onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco_empresa">Endereço</Label>
                    <Input
                      id="endereco_empresa"
                      value={empresa.endereco}
                      onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade_empresa">Cidade</Label>
                    <Input
                      id="cidade_empresa"
                      value={empresa.cidade}
                      onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado_empresa">Estado</Label>
                    <Input
                      id="estado_empresa"
                      value={empresa.estado}
                      onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep_empresa">CEP</Label>
                    <InputMask
                      mask={masks.cep}
                      value={empresa.cep}
                      onChange={(e) => setEmpresa({ ...empresa, cep: e.target.value })}
                    >
                      {(inputProps: any) => <Input {...inputProps} id="cep_empresa" />}
                    </InputMask>
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Dados da Empresa"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Tema do Sistema</CardTitle>
              <CardDescription>
                Escolha entre tema claro ou escuro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema Atual</Label>
                <Select value={theme} onValueChange={(value: "light" | "dark") => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Claro</SelectItem>
                    <SelectItem value="dark">🌙 Escuro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sua escolha será salva automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipamentos">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Impressoras</CardTitle>
              <CardDescription>
                Configure as impressoras do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="impressora_padrao">Impressora Padrão</Label>
                <Select defaultValue="nenhuma">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma impressora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma configurada</SelectItem>
                    <SelectItem value="termica1">Impressora Térmica 1</SelectItem>
                    <SelectItem value="termica2">Impressora Térmica 2</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Configuração de impressoras em desenvolvimento
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Impressoras Configuradas</h4>
                <p className="text-sm text-muted-foreground">
                  Nenhuma impressora configurada no momento.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  <Printer className="mr-2 h-4 w-4" />
                  Adicionar Impressora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

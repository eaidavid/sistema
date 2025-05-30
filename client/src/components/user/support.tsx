import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Phone, Mail, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const supportSchema = z.object({
  subject: z.string().min(5, "Assunto deve ter pelo menos 5 caracteres"),
  message: z.string().min(20, "Mensagem deve ter pelo menos 20 caracteres"),
});

type SupportData = z.infer<typeof supportSchema>;

interface SupportProps {
  onPageChange?: (page: string) => void;
}

export default function Support({ onPageChange }: SupportProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<SupportData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (data: SupportData) => {
      const response = await apiRequest("POST", "/api/support/contact", {
        ...data,
        name: user?.fullName,
        email: user?.email,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Sua mensagem foi enviada com sucesso. Retornaremos em breve!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportData) => {
    sendMessage.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Suporte</h1>
          <p className="text-slate-400 mt-1">Entre em contato conosco para dúvidas e suporte</p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-500" />
                Fale Conosco
              </CardTitle>
              <CardDescription className="text-slate-400">
                Envie sua mensagem e nossa equipe retornará em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Nome Completo</Label>
                    <Input
                      value={user?.fullName || ""}
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white">Assunto</Label>
                  <Input
                    {...form.register("subject")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Digite o assunto da sua mensagem"
                  />
                  {form.formState.errors.subject && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message" className="text-white">Mensagem</Label>
                  <Textarea
                    {...form.register("message")}
                    className="bg-slate-700 border-slate-600 text-white min-h-32"
                    placeholder="Descreva detalhadamente sua dúvida ou problema..."
                  />
                  {form.formState.errors.message && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.message.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  disabled={sendMessage.isPending}
                >
                  {sendMessage.isPending ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-slate-400 text-sm">suporte@afiliadosbet.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-white font-medium">WhatsApp</p>
                  <p className="text-slate-400 text-sm">+55 (11) 99999-9999</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-white font-medium">Horário de Atendimento</p>
                  <p className="text-slate-400 text-sm">Segunda a Sexta</p>
                  <p className="text-slate-400 text-sm">08:00 às 18:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                Dúvidas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-white font-medium text-sm">Como gerar meus links?</h4>
                <p className="text-slate-400 text-sm">Acesse "Casas de Apostas" e clique em "Gerar Link"</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium text-sm">Quando recebo pagamentos?</h4>
                <p className="text-slate-400 text-sm">Pagamentos são processados toda semana</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium text-sm">Como acompanhar conversões?</h4>
                <p className="text-slate-400 text-sm">Verifique seus relatórios em tempo real</p>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => onPageChange?.('reports')}
              >
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
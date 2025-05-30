import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const paymentDataSchema = z.object({
  paymentType: z.enum(["pix", "bank"]),
  holderName: z.string().min(1, "Nome do titular é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  pixKey: z.string().optional(),
  bankCode: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
});

type PaymentData = z.infer<typeof paymentDataSchema>;

interface PaymentsProps {
  onPageChange?: (page: string) => void;
}

export default function Payments({ onPageChange }: PaymentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentType, setPaymentType] = useState<"pix" | "bank">("pix");

  const { data: paymentConfig } = useQuery({
    queryKey: ["/api/user/payment-config"],
    retry: false,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/user/payments"],
    retry: false,
  });

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentDataSchema),
    defaultValues: {
      paymentType: "pix",
      holderName: paymentConfig?.holderName || "",
      cpf: paymentConfig?.cpf || "",
      pixKey: paymentConfig?.pixKey || "",
      bankCode: paymentConfig?.bankCode || "",
      agency: paymentConfig?.agency || "",
      account: paymentConfig?.account || "",
    },
  });

  const savePaymentConfig = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await apiRequest("POST", "/api/user/payment-config", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Dados de pagamento salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/payment-config"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar dados de pagamento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentData) => {
    savePaymentConfig.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Falhou</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
          <p className="text-slate-400 mt-1">Configure seus dados de recebimento e acompanhe pagamentos</p>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Configuration */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              Dados para Recebimento
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure como deseja receber seus pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="paymentType" className="text-white">Tipo de Recebimento</Label>
                <Select value={paymentType} onValueChange={(value: "pix" | "bank") => {
                  setPaymentType(value);
                  form.setValue("paymentType", value);
                }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="bank">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="holderName" className="text-white">Nome do Titular</Label>
                <Input
                  {...form.register("holderName")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Digite o nome completo"
                />
                {form.formState.errors.holderName && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.holderName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf" className="text-white">CPF</Label>
                <Input
                  {...form.register("cpf")}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="000.000.000-00"
                />
                {form.formState.errors.cpf && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.cpf.message}</p>
                )}
              </div>

              {paymentType === "pix" ? (
                <div>
                  <Label htmlFor="pixKey" className="text-white">Chave PIX</Label>
                  <Input
                    {...form.register("pixKey")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Email, telefone, CPF ou chave aleatória"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="bankCode" className="text-white">Código do Banco</Label>
                    <Input
                      {...form.register("bankCode")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: 001, 341, 033"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agency" className="text-white">Agência</Label>
                    <Input
                      {...form.register("agency")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account" className="text-white">Conta</Label>
                    <Input
                      {...form.register("account")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="00000-0"
                    />
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                disabled={savePaymentConfig.isPending}
              >
                {savePaymentConfig.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription className="text-slate-400">
              Seus pagamentos recebidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Data</TableHead>
                      <TableHead className="text-slate-300">Valor</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id} className="border-slate-700">
                        <TableCell className="text-white">
                          {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          R$ {payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            {getStatusBadge(payment.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {payment.method === 'pix' ? 'PIX' : 'Transferência'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum pagamento encontrado</p>
                <p className="text-slate-500 text-sm">Seus pagamentos aparecerão aqui quando processados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
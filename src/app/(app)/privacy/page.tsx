import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getSellerInfo } from "@/infrastructure/config/greenConfig";

export const metadata: Metadata = { title: "Política de privacidade — DietGreen" };
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const seller = getSellerInfo();
  const contact = seller.email || "[SELLER_EMAIL]";
  return (
    <LegalPage title="Política de privacidade" updated="01/10/2026">
      <h2>Controlador e canal de contato</h2>
      <p>
        Controlador: {seller.name || "[SELLER_NAME]"}. Canal para exercer seus direitos e falar sobre seus dados: {contact}. Como agente de
        tratamento de pequeno porte, não há encarregado (DPO) nomeado, mas este canal cumpre essa função (Resolução CD/ANPD nº 2/2022).
      </p>
      <h2>Quais dados tratamos e por quê</h2>
      <ul>
        <li>Conta (nome, e-mail e foto do Google/GitHub): para login. Base: execução de contrato.</li>
        <li>Dados do cardápio (peso, altura, idade, objetivo, preferências): para gerar o cardápio. Base: execução de contrato.</li>
        <li>Mensagens com a Green: guardadas criptografadas para dar continuidade à conversa. Base: execução de contrato e consentimento.</li>
        <li>Exames de sangue: dado pessoal sensível. O arquivo é processado e descartado logo após a leitura, nunca é armazenado. Os valores só são guardados, criptografados, se você autorizar. Base: consentimento específico e destacado (LGPD, art. 11, I).</li>
        <li>Pagamentos (valor, data, status, identificador do Mercado Pago): para entregar a compra e cumprir obrigações fiscais. Base: contrato e obrigação legal.</li>
        <li>Registros de acesso (IP, data e rota): guardados por 6 meses (Marco Civil da Internet, art. 15).</li>
        <li>Consumo da IA (tokens e custo de cada resposta): para cobrar o uso real e calcular preços.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <ul>
        <li>Anthropic (EUA), provedora da IA: recebe as mensagens e os arquivos de exame para gerar respostas. Há transferência internacional de dados (LGPD, art. 33), feita sob os termos comerciais do provedor, que não usam dados da API para treinar modelos por padrão.</li>
        <li>Mercado Pago: processa os pagamentos por Pix.</li>
        <li>Neon (banco de dados) e Render (hospedagem): armazenam e executam o serviço.</li>
      </ul>
      <p>Não vendemos dados nem os usamos para publicidade.</p>
      <h2>Seus direitos (LGPD, art. 18)</h2>
      <p>
        No seu perfil você pode baixar todos os seus dados, apagar o histórico do chat, apagar exames, revogar consentimentos e apagar sua
        conta. Revogar o consentimento de exames apaga os valores salvos imediatamente. Registros de pagamento ficam anonimizados pelo prazo
        exigido pela lei fiscal. Outros pedidos: {contact}. Você também pode reclamar à ANPD.
      </p>
      <h2>Segurança</h2>
      <p>Mensagens e exames são criptografados (AES-256-GCM) no banco; a conexão é sempre HTTPS. Em caso de incidente relevante, avisaremos você e a ANPD.</p>
      <h2>Menores</h2>
      <p>O chat é destinado a maiores de 18 anos.</p>
    </LegalPage>
  );
}

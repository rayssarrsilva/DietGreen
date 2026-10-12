import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getGreenConfig, getSellerInfo } from "@/infrastructure/config/greenConfig";

export const metadata: Metadata = { title: "Termos de uso — DietGreen" };
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const seller = getSellerInfo();
  const config = getGreenConfig();
  return (
    <LegalPage title="Termos de uso" updated="01/10/2026">
      <h2>1. Quem oferece o serviço</h2>
      <p>
        O DietGreen é oferecido por {seller.name || "[SELLER_NAME]"}, CPF/CNPJ {seller.document || "[SELLER_DOCUMENT]"}, endereço{" "}
        {seller.address || "[SELLER_ADDRESS]"}, contato {seller.email || "[SELLER_EMAIL]"} (Decreto 7.962/2013).
      </p>
      <h2>2. Natureza do serviço</h2>
      <p>
        O DietGreen gera cardápios a partir de dados nutricionais públicos e oferece a Green, uma inteligência artificial educativa.
        A Green não é nutricionista nem médica, não tem registro profissional e não faz diagnóstico, prescrição dietética
        individualizada (atividade privativa de nutricionista, Lei 8.234/1991), nem indica doses de suplementos ou medicamentos.
        As respostas podem conter erros: confirme decisões de saúde com profissionais habilitados. Em emergência, ligue 192 (SAMU).
      </p>
      <h2>3. Idade mínima</h2>
      <p>O uso do chat e a compra de créditos são permitidos apenas para maiores de 18 anos.</p>
      <h2>4. Teste grátis, Premium e créditos</h2>
      <ul>
        <li>Cada conta tem {config.trialLimit} mensagens grátis, no máximo 1 a cada 24 horas. O teste é só de texto e pode ser pausado até o mês seguinte se a verba gratuita mensal do serviço acabar.</li>
        <li>O Premium dá {config.premiumDays} dias de acesso à compra de créditos e é pago por Pix, sem renovação automática. Comprar Premium ou créditos encerra o teste grátis da conta.</li>
        <li>Créditos são pré-pagos, guardados em reais e não expiram. Cada resposta desconta o custo real medido pelo uso da IA; a quantidade de mensagens mostrada na compra é uma estimativa pela média.</li>
        <li>Créditos continuam utilizáveis se o Premium vencer, mas novas compras de créditos exigem Premium ativo.</li>
        <li>O preço é composto por custo da IA, taxa do meio de pagamento e margem do serviço, exibidos antes do pagamento.</li>
      </ul>
      <h2>5. Direito de arrependimento</h2>
      <p>
        Em até {config.refundWindowDays} dias da aprovação do pagamento (CDC, art. 49), você pode desistir pela página de perfil.
        O Premium é devolvido integralmente e encerrado na hora. Para créditos, devolvemos o valor proporcional aos créditos daquela
        compra que ainda não foram usados, porque o serviço já prestado foi consumido a seu pedido. Dúvidas: {seller.email || "[SELLER_EMAIL]"}.
      </p>
      <h2>6. Uso aceitável</h2>
      <p>É proibido usar o serviço para fins ilegais, tentar burlar limites (como criar várias contas para repetir o teste), ou enviar arquivos de terceiros sem autorização.</p>
      <h2>7. Disponibilidade e alterações</h2>
      <p>O serviço pode ficar indisponível ou mudar. Mudanças de preço valem para compras futuras; saldo já comprado é mantido.</p>
      <h2>8. Foro</h2>
      <p>Aplica-se a lei brasileira. Fica eleito o foro do domicílio do consumidor.</p>
    </LegalPage>
  );
}

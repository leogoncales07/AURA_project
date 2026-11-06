# AURA — procedimento de incidentes

Este procedimento é um modelo operacional para o projeto. Deve ser adaptado ao responsável definitivo e revisto antes da publicação pública.

## 1. Conter e preservar

1. Interromper a funcionalidade afetada sem apagar provas.
2. Rodar credenciais expostas no fornecedor correspondente e revogar sessões quando necessário.
3. Preservar horários, logs técnicos, versões publicadas e ações executadas. Não copiar conteúdo pessoal para canais informais.
4. Identificar quem coordena o incidente a partir de `docs/release-decisions.json`.

## 2. Avaliar

Registar, num ficheiro privado separado:

- data e hora de deteção e do início provável;
- sistemas, fornecedores e versões afetados;
- categorias e quantidade aproximada de pessoas e registos envolvidos;
- existência de dados de bem-estar, credenciais, tokens ou identificadores;
- possibilidade de acesso, alteração, perda ou divulgação;
- medidas de contenção já aplicadas e riscos que permanecem.

Não colocar dados pessoais ou segredos no Git, em issues públicas ou no relatório escolar.

## 3. Comunicar e decidir

- Informar imediatamente o responsável pelo serviço e o contacto técnico definido.
- Se houver risco para dados pessoais, obter orientação adequada e avaliar a obrigação de notificar a autoridade de controlo. Quando o RGPD for aplicável, a decisão sobre eventual notificação deve ser tomada sem demora e considerando o prazo legal de 72 horas após conhecimento da violação.
- Quando existir risco elevado para as pessoas, preparar uma comunicação clara: o que aconteceu, dados envolvidos, consequências prováveis, medidas tomadas e ações recomendadas.
- Contactar Supabase, alojamento, Google ou lojas apenas pelos canais oficiais e guardar os números dos casos.

## 4. Recuperar e aprender

1. Corrigir a causa, testar a correção e publicar de forma controlada.
2. Confirmar que exportação, eliminação, autenticação e backups continuam funcionais.
3. Registar a decisão de notificar ou não notificar, os fundamentos e os tempos.
4. Atualizar testes, configuração, inventário de chaves e este procedimento.

## Demonstração escolar

Se forem usados exclusivamente dados fictícios e `AURA_SCHOOL_DEMO=true`, um problema técnico da apresentação deve ser registado e corrigido, mas não deve ser descrito automaticamente como violação de dados pessoais. Se alguém introduzir dados reais, interromper a demonstração, não projetar esses dados e aplicar a avaliação acima.

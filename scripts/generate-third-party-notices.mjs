import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = path.join(projectRoot, 'docs', 'dependency-license-inventory.json');
const outputPath = path.join(projectRoot, 'docs', 'THIRD_PARTY_NOTICES.md');
const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));

const grouped = new Map();
for (const entry of inventory.entries) {
  const list = grouped.get(entry.license) || [];
  list.push(entry);
  grouped.set(entry.license, list);
}

const sections = [...grouped.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([license, entries]) => {
    const packages = entries
      .sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version))
      .map(entry => `- \`${entry.name}@${entry.version}\` (${entry.projects.join(', ')})`)
      .join('\n');
    return `## ${license}\n\n${packages}`;
  })
  .join('\n\n');

const generatedAt = new Date().toISOString();
const markdown = `# AURA — avisos de software de terceiros

Gerado em ${generatedAt} a partir de \`docs/dependency-license-inventory.json\`.

A AURA utiliza os componentes abaixo. Este ficheiro identifica pacote, versão, licença declarada e projeto consumidor; não substitui o texto integral de cada licença. Os ficheiros de licença e copyright fornecidos pelos autores devem permanecer junto das dependências instaladas e dos pacotes de código-fonte distribuídos.

## Obrigações que exigem atenção no empacotamento final

- Conservar os avisos e textos das licenças MIT, BSD, ISC e Apache-2.0 fornecidos nos pacotes.
- Conservar a atribuição de \`caniuse-lite\` (CC-BY-4.0) e a referência à respetiva licença.
- Não remover os avisos ou a possibilidade de obter o código dos componentes cobertos por MPL-2.0 e LGPL-3.0-or-later. Se forem modificados ou incorporados de outra forma na distribuição, rever novamente as obrigações aplicáveis.
- Para \`node-forge\`, a distribuição pode seguir a alternativa BSD-3-Clause declarada pelo pacote.
- Antes de submeter uma build móvel, confirmar que os avisos continuam acessíveis no pacote ou através de uma página legal pública ligada pela aplicação.

Nenhuma entrada do inventário declara licença comercial paga. A aprovação jurídica final e a verificação do artefacto efetivamente distribuído continuam separadas deste inventário técnico.

${sections}
`;

await fs.writeFile(outputPath, markdown, 'utf8');
console.log(JSON.stringify({ generatedAt, packages: inventory.entries.length, licenses: grouped.size, output: path.relative(projectRoot, outputPath) }, null, 2));

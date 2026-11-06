import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projects = ['backend', 'frontend', 'mobile'];
const inventory = new Map();
const directByProject = new Map();

const packageNameFromLockPath = lockPath => lockPath.split('node_modules/').at(-1);
const normalizedLicense = value => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value.type === 'string') return value.type.trim();
  if (Array.isArray(value)) {
    const types = [...new Set(value.map(item => typeof item === 'string' ? item : item?.type).filter(Boolean))];
    if (types.length) return types.join(' OR ');
  }
  return 'UNKNOWN';
};
const detectedLicenseFromText = text => {
  if (/Permission is hereby granted, free of charge, to any person obtaining a copy/i.test(text)) return 'MIT';
  if (/Apache License\s+Version 2\.0/i.test(text)) return 'Apache-2.0';
  if (/Permission to use, copy, modify, and\/or distribute this software for any purpose/i.test(text)) return 'ISC';
  return 'UNKNOWN';
};

for (const project of projects) {
  const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, project, 'package.json'), 'utf8'));
  const lock = JSON.parse(await fs.readFile(path.join(projectRoot, project, 'package-lock.json'), 'utf8'));
  const directNames = new Set(Object.keys(manifest.dependencies || {}));
  directByProject.set(project, directNames);

  for (const [lockPath, entry] of Object.entries(lock.packages || {})) {
    if (!lockPath.includes('node_modules/') || entry.dev === true || !entry.version) continue;
    const name = packageNameFromLockPath(lockPath);
    const key = `${name}@${entry.version}`;
    let declaredLicense = normalizedLicense(entry.license);
    if (declaredLicense === 'UNKNOWN') {
      const installedDir = path.join(projectRoot, project, lockPath);
      const installedManifest = await fs.readFile(path.join(installedDir, 'package.json'), 'utf8')
        .then(JSON.parse)
        .catch(() => null);
      declaredLicense = normalizedLicense(installedManifest?.license || installedManifest?.licenses);
      if (declaredLicense === 'UNKNOWN') {
        const licenseName = await fs.readdir(installedDir)
          .then(names => names.find(name => /^(licen[cs]e|copying)(\.|$)/i.test(name)))
          .catch(() => null);
        if (licenseName) {
          const licenseText = await fs.readFile(path.join(installedDir, licenseName), 'utf8').catch(() => '');
          declaredLicense = detectedLicenseFromText(licenseText);
        }
      }
    }
    const current = inventory.get(key) || {
      name,
      version: entry.version,
      license: declaredLicense,
      projects: new Set(),
      directIn: new Set()
    };

    current.projects.add(project);
    if (directNames.has(name)) current.directIn.add(project);
    if (current.license === 'UNKNOWN' && declaredLicense !== 'UNKNOWN') current.license = declaredLicense;
    inventory.set(key, current);
  }
}

const entries = [...inventory.values()]
  .map(entry => ({ ...entry, projects: [...entry.projects].sort(), directIn: [...entry.directIn].sort() }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
const needsReview = entry => /UNKNOWN|UNLICENSED|SEE LICENSE|AGPL|LGPL|(^|[^L])GPL|MPL|EPL|CDDL|SSPL|BUSL|CC-BY|Commons Clause/i.test(entry.license);
const reviewEntries = entries.filter(needsReview);
const licenseCounts = Object.entries(entries.reduce((counts, entry) => {
  counts[entry.license] = (counts[entry.license] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const directRows = entries.filter(entry => entry.directIn.length > 0)
  .map(entry => `| \`${entry.name}\` | ${entry.version} | ${entry.license} | ${entry.directIn.join(', ')} |`)
  .join('\n');
const reviewRows = reviewEntries.length
  ? reviewEntries.map(entry => `| \`${entry.name}\` | ${entry.version} | ${entry.license} | ${entry.projects.join(', ')} |`).join('\n')
  : '| — | — | Nenhum item sinalizado pelo filtro automático | — |';
const countRows = licenseCounts.map(([license, count]) => `| ${license} | ${count} |`).join('\n');

const generatedAt = new Date().toISOString();
const markdown = `# AURA — inventário de licenças de dependências

Gerado automaticamente em ${generatedAt} a partir dos três ficheiros \`package-lock.json\`. Foram consideradas as dependências de produção; ferramentas marcadas apenas como desenvolvimento ficaram de fora.

Este relatório demonstra que as bibliotecas não exigem, por si só, a compra de uma licença comercial. Não substitui os ficheiros de licença completos nem uma revisão jurídica. Antes da distribuição final, o pacote publicado deve conservar os avisos e textos exigidos por cada licença.

## Resumo

- Pacotes/versões de produção distintos: **${entries.length}**
- Dependências diretas distintas: **${entries.filter(entry => entry.directIn.length > 0).length}**
- Itens sinalizados para revisão manual: **${reviewEntries.length}**

## Dependências diretas

| Pacote | Versão instalada | Licença declarada | Projeto |
| --- | --- | --- | --- |
${directRows}

## Itens para revisão manual

O filtro assinala licença ausente, \`UNLICENSED\`, licenças que remetem para outro ficheiro, famílias copyleft (incluindo MPL/LGPL/GPL/AGPL) e licenças com atribuição específica, como CC-BY. Um item nesta lista não significa automaticamente que seja proibido ou pago; significa apenas que não deve ser aprovado sem ler e cumprir a licença concreta.

| Pacote | Versão | Licença declarada | Projeto |
| --- | --- | --- | --- |
${reviewRows}

## Distribuição por licença

| Licença declarada | Pacotes/versões |
| --- | ---: |
${countRows}

## Como atualizar

Na raiz do projeto:

\`\`\`sh
node scripts/audit-dependency-licenses.mjs
\`\`\`

O inventário detalhado, adequado a verificações automáticas, fica em \`docs/dependency-license-inventory.json\`.
`;

const serializable = entries.map(entry => ({
  name: entry.name,
  version: entry.version,
  license: entry.license,
  projects: entry.projects,
  directIn: entry.directIn,
  needsManualReview: needsReview(entry)
}));

await fs.writeFile(path.join(projectRoot, 'docs', 'DEPENDENCY_LICENSES.md'), markdown, 'utf8');
await fs.writeFile(path.join(projectRoot, 'docs', 'dependency-license-inventory.json'), `${JSON.stringify({ generatedAt, entries: serializable }, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ generatedAt, packages: entries.length, direct: serializable.filter(entry => entry.directIn.length).length, needsManualReview: reviewEntries.length }, null, 2));

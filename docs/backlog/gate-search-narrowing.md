# Backlog: O gate estreitava a busca em silêncio
PRD: n/a — manutenção do framework; o próprio gate é o spec.
Generated: 2026-08-28

## Execution plan
- Sequential: AFT-305 (tarefa única)

## Tasks

### AFT-305 — A busca por testes de aceitação não pode estreitar sozinha
- **Status:** in-review
- **Branch:** fix/gate-nao-estreitar-busca
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** `ACCEPTANCE_DIRS` tinha por omissão uma lista de nomes de pasta
  (`tests test __tests__ spec e2e src`), e o gate procurava naquelas que **existissem**, caindo
  na árvore inteira só quando **nenhuma** existia. Num repo consumidor que ganhou uma pasta
  `e2e/` na raiz, a busca passou silenciosamente a olhar só para lá, deixando de ver
  `apps/` e `packages/`. Deu os dois modos de falha: reprovou uma tarefa cujos testes existiam
  em `packages/`, e aprovou outra porque o id aparecia num **comentário** dentro do único
  diretório que ainda inspecionava — cobertura reportada sem nunca ter sido verificada.
- **Acceptance criteria:**
  - [x] Sem `ACCEPTANCE_DIRS`, a busca varre a árvore inteira, não uma lista de nomes
  - [x] Um teste em `packages/**` é encontrado mesmo existindo uma pasta `e2e/` na raiz
  - [x] Com `ACCEPTANCE_DIRS` explícito, a busca estreita de propósito, como antes
  - [x] Uma pasta nomeada em `ACCEPTANCE_DIRS` que não existe é **reportada**, não ignorada em silêncio
  - [x] `node_modules`, `.next`, `dist` e `.git` ficam fora da varredura
- **Acceptance tests:**
  - [x] `AFT-305: with no ACCEPTANCE_DIRS the gate searches the whole tree` — integração —
        monta um repo com `e2e/` na raiz e o teste real em `packages/db`, a forma exata que partiu
  - [x] `AFT-305: an explicit ACCEPTANCE_DIRS still narrows, and says what it ignored` — integração
- **Contracts:** `ACCEPTANCE_DIRS` deixa de ter valor por omissão. Vazio significa "varre tudo".
- **Touches:** .claude/scripts/quality-gate.sh, tests/framework.test.js
- **Nota de causa:** o repo consumidor tinha `ACCEPTANCE_DIRS` no `env` do
  `.claude/settings.json`, o que **não chega ao shell** onde o gate corre. Confiar nessa
  definição era frágil; a correção torna o gate correto sem ela.

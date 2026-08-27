# Backlog: O job validate não podia falhar
PRD: n/a — manutenção do framework; o workflow é o spec.
Generated: 2026-08-27

## Execution plan
- Sequential: AFT-304 (tarefa única)

## Tasks

### AFT-304 — Os passos de validação devem propagar falhas
- **Status:** in-review
- **Branch:** fix/ci-nao-engolir-falhas
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** Cada um dos quatro passos do job `validate` corria
  `node -e <script existe?> && <pm> <script> || echo "no X script — skipped"`. O `||` apanhava
  um script **que falha** exatamente como apanhava um script **em falta**: o passo imprimia
  "skipped" e saía com 0. Lint, typecheck, test e build nunca puderam reprovar uma PR. Foi
  encontrado num repo consumidor onde `pnpm build` falhava no ramo de integração enquanto
  todas as PRs reportavam o job verde.
- **Acceptance criteria:**
  - [x] Um script que falha faz o passo falhar
  - [x] Um script em falta continua a ser saltado, com a mensagem correta
  - [x] Vale para os quatro passos: lint, typecheck, test, build
  - [x] O workflow continua a ser YAML válido
- **Acceptance tests:**
  - [x] `AFT-304: no validate step swallows a script failure with ||` — unit — falha se algum
        dos quatro passos voltar ao encadeamento com `||`
  - [x] `AFT-304: the shell pattern itself distinguishes missing from failing` — integração —
        corre os dois padrões contra um `package.json` cujo `lint` sai com 3, e afirma que o
        antigo devolvia 0 e o novo não
- **Contracts:** o job `validate` mantém os mesmos nomes de passo, portanto as regras de
  proteção de branch que os exigem não mudam.
- **Touches:** .github/workflows/pr-validation.yml, tests/framework.test.js
- **Test notes:** `npm test`. O segundo teste documenta o bug ao afirmar explicitamente que o
  padrão antigo devolvia 0 — se alguém reintroduzir o `||`, o primeiro teste apanha.

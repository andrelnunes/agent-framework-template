# Backlog: Derivação do id da tarefa no CI
PRD: n/a — manutenção do framework; o template de PR é o spec.
Generated: 2026-08-27

## Execution plan
- Sequential: AFT-303 (tarefa única)

## Tasks

### AFT-303 — O gate de aceitação deve ler o id da linha "Task:"
- **Status:** in-review
- **Branch:** fix/task-id-do-campo-task
- **Depends on:** none
- **Can parallelize with:** none
- **Description:** O job `acceptance-tests` extraía o id com o primeiro token no formato
  `[A-Z]{2,4}-[0-9]+` encontrado no corpo, título ou branch. Um corpo de PR bem escrito cita
  user stories (`US-01`), outras tarefas e issues — qualquer uma delas aparece antes do id da
  tarefa e sequestra a correspondência. Deu os dois modos de falha em produção: uma PR
  correta rejeitada porque o gate procurou o id errado, e — pior — uma PR aprovada porque o
  ficheiro de teste por acaso mencionava o id sequestrado, com o gate a reportar cobertura
  que nunca verificou.
- **Acceptance criteria:**
  - [x] O id vem da linha `Task:` do template de PR, mesmo que outro id apareça antes
  - [x] Reconhece a forma em markdown do template (`- **Task:** WND-07`)
  - [x] Sem linha `Task:`, cai para um trailer `Refs:`
  - [x] Sem nenhum dos dois, cai para o nome do branch (`feat/ux-08` → `UX-08`)
  - [x] Sem id em lado nenhum, devolve vazio para o chamador falhar de forma explícita
  - [x] O workflow deixa de conter a extração antiga
- **Acceptance tests:**
  - [x] `AFT-303: the task id is taken from the Task: line, not the first id in the body` —
        unit — exercita as cinco precedências contra o script partilhado
  - [x] `AFT-303: CI derives the task id through the shared script` — unit — falha se o
        workflow voltar à extração antiga
- **Contracts:** `.claude/scripts/task-id.sh <body> <title> <branch>` imprime o id ou vazio.
  O job `acceptance-tests` passa a chamá-lo.
- **Touches:** .claude/scripts/task-id.sh, .github/workflows/pr-validation.yml, tests/framework.test.js
- **Test notes:** `npm test`. O script é puro texto — testável diretamente, sem CI.

# Backlog: Artefactos de build satisfaziam o gate
PRD: n/a — manutenção do framework.
Generated: 2026-08-28

## Execution plan
- Sequential: AFT-306 (tarefa única)

## Tasks

### AFT-306 — Um log de build não é um teste de aceitação
- **Status:** in-review
- **Branch:** fix/gate-ignorar-artefactos
- **Depends on:** AFT-305
- **Can parallelize with:** none
- **Description:** O glob `*Test.*` é aplicado com `-iname`, portanto casa com nomes como
  `turbo-test.log`. Um log de build contém os nomes dos testes que acabou de correr — e
  portanto os ids das tarefas — por isso um artefacto podia satisfazer o portão sozinho, sem
  existir teste nenhum. Descoberto imediatamente a seguir ao AFT-305: assim que a varredura
  passou a cobrir a árvore inteira, o `apps/web/.turbo/turbo-test.log` apareceu como
  "teste de aceitação encontrado".
- **Acceptance criteria:**
  - [x] Um `.log` nunca conta como teste de aceitação, ainda que o nome case com os globs
  - [x] `.turbo`, `coverage`, `build` e `out` ficam fora da varredura
  - [x] Um repo cujo único ficheiro a citar o id é um log **reprova** o portão
- **Acceptance tests:**
  - [x] `AFT-306: a build log mentioning the task id does not satisfy the gate` — integração —
        monta um repo com `.turbo/turbo-test.log` a citar o id e nenhum teste real, e afirma
        que o gate reprova
- **Contracts:** nenhum. Os globs continuam configuráveis.
- **Touches:** .claude/scripts/quality-gate.sh, tests/framework.test.js
- **Nota:** quarta ocorrência nesta série do mesmo padrão — um portão que degrada em no-op em
  vez de reprovar. Ver AFT-303 (id sequestrado), AFT-304 (falhas engolidas) e AFT-305 (busca
  estreitada).

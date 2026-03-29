# MedTracker - Instruções para Claude

## REGRAS ABSOLUTAS — NUNCA QUEBRAR
- **NUNCA criar migrations automáticas** que modificam dados (reviews, sessions, exams, revLogs) no load do app. Dados do usuário são sagrados.
- **NUNCA fazer push automático para a nuvem** após modificar dados locais. O usuário controla quando sincronizar.
- **NUNCA recalcular/reconstruir reviews, intervalos, ou histórico** automaticamente. Se precisar corrigir, criar botão manual com confirmação.
- **NUNCA deduplicar dados automaticamente** no load. Dedup só via botão manual.
- **Sempre testar o build** (`npm run build`) antes de commitar.
- **Sempre verificar que o código não modifica localStorage no load** — o app deve carregar e exibir dados como estão, sem alterar.

## Provas (Exams)
- **Toda prova nova DEVE ser hardcoded no código** (função `buildXxxExam()` em `data.js`), igual `buildUnicamp2024Exam()` e `buildUfcspa2026Exam()`. Nunca salvar prova apenas no localStorage — se o storage for limpo, a prova se perde.
- No `App.jsx`, garantir que provas hardcoded sejam restauradas automaticamente se estiverem faltando no localStorage (pattern: `if (!loadedExams.some(...)) loadedExams.push(buildXxxExam())`).
- Incluir no seed path (primeira execução) E na verificação de existência (usuário existente).

## Git workflow
- Sempre fazer as mudanças diretamente no branch `main`.
- Sempre fazer merge no `main` e push após qualquer alteração. Nunca deixar mudanças apenas em branches separados.
- **OBRIGATÓRIO após cada push no main**: atualizar TODOS os branches ativos (ex: `claude/fix-app-bugs-WUQAW`) com merge do main e fazer push deles também. Sequência correta:
  1. `git add` + `git commit` no `main`
  2. `git push -u origin main`
  3. `git checkout claude/fix-app-bugs-WUQAW && git merge main && git push -u origin claude/fix-app-bugs-WUQAW`
  4. `git checkout main`
- Nunca considerar o trabalho feito até que TODOS os branches estejam atualizados e pushed.

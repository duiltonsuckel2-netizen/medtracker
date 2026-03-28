# MedTracker - Instruções para Claude

## Git workflow
- Sempre fazer as mudanças diretamente no branch `main`.
- Sempre fazer merge no `main` e push após qualquer alteração. Nunca deixar mudanças apenas em branches separados.
- **OBRIGATÓRIO após cada push no main**: atualizar TODOS os branches ativos (ex: `claude/fix-app-bugs-WUQAW`) com merge do main e fazer push deles também. Sequência correta:
  1. `git add` + `git commit` no `main`
  2. `git push -u origin main`
  3. `git checkout claude/fix-app-bugs-WUQAW && git merge main && git push -u origin claude/fix-app-bugs-WUQAW`
  4. `git checkout main`
- Nunca considerar o trabalho feito até que TODOS os branches estejam atualizados e pushed.

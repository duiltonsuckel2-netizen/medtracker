# CLAUDE.md — Regras do Projeto

## Controle de Commits e GitHub

- Agrupe todas as alterações em poucos commits significativos
- Nunca faça mais de 3 pushes por hora
- Não faça push automático — espere aprovação antes de dar push
- Faça commit apenas quando uma etapa completa estiver funcionando
- Use mensagens de commit descritivas em português

## Evitar Timeouts

- Divida tarefas grandes em subtarefas menores antes de começar
- Implemente operações pesadas de forma assíncrona (async/await, filas, workers)
- Configure timeouts explícitos em todas as chamadas externas (API, banco de dados)
- Adicione retry com backoff exponencial em chamadas que podem falhar
- Nunca faça operações síncronas que demorem mais de 10 segundos

## Qualidade e Testes (IMPORTANTE)

- Antes de entregar qualquer função nova, TESTE você mesmo no código
- Rode o código mentalmente ou com exemplos para verificar se funciona
- Verifique erros comuns antes de entregar:
  - Imports faltando
  - Variáveis não declaradas ou com nome errado
  - Tipos incompatíveis (string vs number, null vs undefined)
  - Funções assíncronas sem await
  - Rotas ou endpoints com path errado
  - Parênteses, chaves e colchetes não fechados
  - Dependências não instaladas no package.json / requirements.txt
- Sempre trate erros com try/catch e retorne mensagens claras
- Adicione logs (console.log / print) nos pontos críticos para facilitar debug
- Nunca assuma que algo funciona — verifique

## Tratamento de Erros Obrigatório

- Toda chamada a API externa deve ter try/catch com fallback
- Toda consulta ao banco de dados deve ter tratamento de erro
- Toda leitura/escrita de arquivo deve ter tratamento de erro
- Retorne mensagens de erro amigáveis para o usuário, nunca erros técnicos crus
- Registre erros detalhados no log do servidor para debug

## Estrutura de Trabalho

- Ao receber uma tarefa grande, primeiro liste as subtarefas antes de começar
- Implemente uma subtarefa por vez, testando cada uma antes de avançar
- Se algo não funcionar, explique o problema e a solução antes de tentar de novo
- Não reescreva código que já funciona sem necessidade
- Ao corrigir um bug, explique a causa raiz do problema

## Padrões de Código

- Mantenha funções pequenas (máximo 30-40 linhas)
- Nomeie variáveis e funções de forma clara e descritiva
- Comente trechos complexos explicando o "porquê", não o "o quê"
- Siga o padrão de código já existente no projeto

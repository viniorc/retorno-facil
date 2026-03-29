# Retorno Fácil

Mini sistema para organizar clientes e retornos de atendimento pelo WhatsApp.

## Objetivo
Ajudar pequenos negócios a cadastrar clientes, acompanhar o status do atendimento e lembrar quem precisa de retorno.

## Versão atual
Versão funcional mínima com cadastro, listagem, dashboard de métricas, alertas visuais de retorno, lembretes do dia, filtro por status, busca, ordenação, botão de WhatsApp, edição e remoção de clientes, mantendo persistência local no navegador.

## Tecnologias
- HTML
- CSS
- JavaScript puro

## O que esta versão já faz
- permite cadastrar cliente pelo formulário
- salva nome, telefone, observação, status e data do próximo retorno
- lista os clientes logo após o salvamento
- mantém os dados no navegador com localStorage
- exibe métricas gerais com base em todos os clientes salvos
- destaca clientes com retorno atrasado
- destaca clientes com retorno previsto para hoje
- mostra uma área separada para retornos de hoje
- mostra uma área separada para retornos atrasados
- filtra os clientes por status
- busca clientes por nome ou telefone
- ordena a lista por nome e por data de retorno
- mostra o estado vazio também para os filtros e a busca atuais
- abre conversa no WhatsApp a partir do telefone salvo
- permite editar um cliente existente pelo formulário
- permite cancelar a edição de forma simples
- permite remover cliente com confirmação

## Próximos passos
- melhorar o acompanhamento dos retornos
- evoluir a interface sem perder simplicidade
- pensar em relatórios e lembretes automáticos

## Observação
Este projeto continua sendo desenvolvido como treino prático de uso do Codex, Git e GitHub, com foco em fluxo profissional de trabalho.

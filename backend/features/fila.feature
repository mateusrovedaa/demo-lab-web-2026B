# language: pt
Funcionalidade: Entrar na lista de espera
  A fila é pública: qualquer pessoa entra com nome e e-mail,
  e qualquer pessoa vê quem está nela — só os nomes.

  Cenário: Entrar na fila com nome e e-mail
    Dado que a fila está vazia
    Quando entro na fila com nome "Carla Dias" e e-mail "carla@exemplo.com"
    Então o status da resposta deve ser 201
    E a lista pública deve conter "Carla Dias"

  Cenário: Faltar o e-mail
    Quando tento entrar na fila só com nome "Sem e-mail"
    Então o status da resposta deve ser 400
    E a resposta deve dizer "dados inválidos"

  Cenário: E-mail sem forma de e-mail
    Quando entro na fila com nome "Eliza" e e-mail "eliza-nao-e-email"
    Então o status da resposta deve ser 400
    E a resposta deve dizer "o e-mail precisa ter forma de e-mail"

  Cenário: Repetir o e-mail
    Dado que a fila está vazia
    Quando entro na fila com nome "Ana" e e-mail "ana@exemplo.com"
    E entro na fila com nome "Ana de novo" e e-mail "ana@exemplo.com"
    Então o status da resposta deve ser 409
    E a resposta deve dizer "esse e-mail já está na lista"

  Cenário: A lista pública esconde os e-mails
    Dado que a fila está vazia
    Quando entro na fila com nome "Carla Dias" e e-mail "carla@exemplo.com"
    Então a lista pública deve conter "Carla Dias"
    Mas a lista pública não deve expor "carla@exemplo.com"

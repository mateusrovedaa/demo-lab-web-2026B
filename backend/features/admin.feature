# language: pt
Funcionalidade: Área da organização
  Os e-mails e o status de cada inscrição só aparecem para quem está logado.
  Quem decide o que cada um pode ver é o servidor, não a tela.

  Cenário: Ver a lista sem sessão
    Quando peço a lista da organização sem estar logado
    Então o status da resposta deve ser 401

  Cenário: Ver a lista logado
    Dado que sou da organização
    E entro na fila com nome "Carla Dias" e e-mail "carla@exemplo.com"
    Quando peço a lista da organização
    Então o status da resposta deve ser 200
    E a lista da organização deve conter o e-mail "carla@exemplo.com"

  Cenário: Chamar alguém da fila
    Dado que sou da organização
    E entro na fila com nome "Carla Dias" e e-mail "carla@exemplo.com"
    Quando marco a inscrição de "carla@exemplo.com" como "chamada"
    Então o status da resposta deve ser 200
    E a resposta deve dizer "chamada"

  Cenário: Status inventado
    Dado que sou da organização
    E entro na fila com nome "Carla Dias" e e-mail "carla@exemplo.com"
    Quando marco a inscrição de "carla@exemplo.com" como "sumiu"
    Então o status da resposta deve ser 400

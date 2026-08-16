import { useEffect, useState } from "react";

// A URL da API não fica chumbada no código: em produção ela é outra.
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function App() {
  const [inscricoes, setInscricoes] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    try {
      const resposta = await fetch(`${API}/inscricoes`);
      setInscricoes(await resposta.json());
    } catch {
      setErro("não consegui falar com a API. O back está rodando?");
    }
  }

  // Roda uma vez, quando a tela aparece.
  useEffect(() => {
    carregar();
  }, []);

  async function enviar(evento) {
    // Sem isso o navegador recarrega a página e o React perde o estado.
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const resposta = await fetch(`${API}/inscricoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email }),
    });

    setEnviando(false);

    // O 400 e o 409 do servidor chegam aqui. Erro do servidor é resposta,
    // não exceção: o fetch só falha se a requisição nem sair.
    if (!resposta.ok) {
      const corpo = await resposta.json();
      setErro(corpo.erro);
      return;
    }

    setNome("");
    setEmail("");
    carregar();
  }

  return (
    <main>
      <h1>Lista de espera</h1>

      <form onSubmit={enviar}>
        <input
          placeholder="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          placeholder="e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button disabled={enviando}>Entrar na fila</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <ul>
        {inscricoes.map((inscricao) => (
          <li key={inscricao.id}>
            <strong>{inscricao.nome}</strong>
            <span>{inscricao.email}</span>
          </li>
        ))}
      </ul>

      {inscricoes.length === 0 && !erro && <p>Ninguém na fila ainda.</p>}
    </main>
  );
}

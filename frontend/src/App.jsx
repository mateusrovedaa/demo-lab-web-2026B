import { useEffect, useState } from "react";

// A URL da API não fica chumbada no código: em produção ela é outra.
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function App() {
  const [inscricoes, setInscricoes] = useState([]);
  const [erro, setErro] = useState(null);

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

  return (
    <main>
      <h1>Lista de espera</h1>

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

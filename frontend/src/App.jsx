import { useCallback, useEffect, useState } from "react";
import { authClient } from "./auth-client";

// A URL da API não fica chumbada no código: em produção ela é outra.
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function App() {
  // O hook devolve a sessão que o servidor reconhece a partir do cookie.
  // Não somos nós que decidimos se está logado: quem decide é o backend.
  const { data: sessao, isPending } = authClient.useSession();

  return (
    <main>
      <header>
        <h1>Lista de espera</h1>
        {!isPending && sessao && (
          <button className="secundario" onClick={() => authClient.signOut()}>
            Sair
          </button>
        )}
      </header>

      <Fila />

      {isPending ? null : sessao ? <Admin usuario={sessao.user} /> : <Login />}
    </main>
  );
}

// Parte pública: qualquer um entra na fila e vê quem está nela, só os nomes.
function Fila() {
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

  useEffect(() => {
    carregar();
  }, []);

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const resposta = await fetch(`${API}/inscricoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email }),
    });

    setEnviando(false);

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
    <section>
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
          </li>
        ))}
      </ul>

      {inscricoes.length === 0 && !erro && <p>Ninguém na fila ainda.</p>}
    </section>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    // A biblioteca devolve `{ data, error }` em vez de estourar exceção.
    // Se der certo, o cookie já veio na resposta e o useSession se atualiza.
    const { error } = await authClient.signIn.email({ email, password: senha });

    setEnviando(false);

    // A mensagem é a mesma para senha errada e para e-mail que não existe.
    // Dizer qual dos dois falhou entrega ao atacante a lista de quem tem conta.
    if (error) {
      setErro("e-mail ou senha inválidos");
    }
  }

  return (
    <section className="painel">
      <h2>Área da organização</h2>
      <form onSubmit={entrar}>
        <input
          placeholder="e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button disabled={enviando}>Entrar</button>
      </form>
      {erro && <p className="erro">{erro}</p>}
    </section>
  );
}

// Some da tela quando ninguém está logado. Isso é conforto, não segurança:
// a rota do servidor devolve 401 mesmo que alguém chame direto no curl.
function Admin({ usuario }) {
  const [inscricoes, setInscricoes] = useState([]);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    const resposta = await fetch(`${API}/admin/inscricoes`, {
      credentials: "include",
    });

    if (!resposta.ok) {
      setErro("sua sessão expirou. Entre de novo");
      return;
    }

    setInscricoes(await resposta.json());
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(id, status) {
    await fetch(`${API}/admin/inscricoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    carregar();
  }

  return (
    <section className="painel">
      <h2>Olá, {usuario.name}</h2>
      {erro && <p className="erro">{erro}</p>}
      <ul>
        {inscricoes.map((inscricao) => (
          <li key={inscricao.id}>
            <strong>{inscricao.nome}</strong>
            <span>{inscricao.email}</span>
            <select
              value={inscricao.status}
              onChange={(e) => mudarStatus(inscricao.id, e.target.value)}
            >
              <option value="na_fila">na fila</option>
              <option value="chamada">chamada</option>
              <option value="desistiu">desistiu</option>
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}

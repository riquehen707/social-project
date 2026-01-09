export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="brand" style={{ marginBottom: "1rem" }}>
        <span className="brand-mark" />
        <span>social</span>
      </div>
      <h1 style={{ margin: 0 }}>Não encontrado</h1>
      <p className="muted">
        O perfil ou conteúdo que você procura não existe. Volte para o feed e
        continue a conversa.
      </p>
    </div>
  );
}

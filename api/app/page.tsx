

export default function Home() {
  const data = {
    name: "V-Stats API",
    version: "1.0.0",
    status: "running",
    endpoints: [
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET  /api/auth/me",
      "GET  /api/clubs",
      "POST /api/clubs",
      "PUT  /api/clubs/:id",
      "DELETE /api/clubs/:id",
      "GET  /api/teams?clubId=",
      "POST /api/teams",
      "PUT  /api/teams",
      "DELETE /api/teams?id=",
      "GET  /api/players?clubId=&teamId=",
      "POST /api/players",
      "PUT  /api/players",
      "DELETE /api/players?id=",
      "GET  /api/matches?teamId=",
      "POST /api/matches",
      "GET  /api/matches/:id",
      "GET  /api/stats?clubId=",
      "POST /api/share-links",
      "GET  /share/:token",
      "GET  /api/opponent-teams",
      "POST /api/opponent-teams",
      "GET  /api/tournaments",
      "POST /api/tournaments",
    ],
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>V-Stats API</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

const { useState } = React;

function LoginScreen({ onLogin }) {
  const [account, setAccount] = useState("100245890");
  const [password, setPassword] = useState("demo");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ account });
  }

  return (
    <main className="card" aria-labelledby="login-title">
      <h1 id="login-title">Sign in to your account</h1>
      <p className="lede">
        Simulated residential portal. Any credentials work for this demo.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="account-id">Account ID</label>
        <input
          id="account-id"
          name="account"
          autoComplete="username"
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit">Log in</button>
      </form>
    </main>
  );
}

function Dashboard({ account, onLogout }) {
  return (
    <section aria-labelledby="dashboard-title">
      <div className="toolbar">
        <button className="ghost" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>
      <main className="card">
        <h1 id="dashboard-title">Account dashboard</h1>
        <p className="lede">Service address 18 Cedar Row · billing cycle Sep 2026</p>
        <dl className="stats">
          <div className="stat">
            <dt>Account ID</dt>
            <dd id="account-id-value">{account}</dd>
          </div>
          <div className="stat">
            <dt>Electricity usage</dt>
            <dd>
              <div id="kwh-usage">450 kWh</div>
            </dd>
          </div>
          <div className="stat">
            <dt>Statement status</dt>
            <dd>Paid</dd>
          </div>
        </dl>
      </main>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="shell">
      <header>
        <div className="brand">Northline Utilities</div>
        <div>Customer portal</div>
      </header>
      {user ? (
        <Dashboard account={user.account} onLogout={() => setUser(null)} />
      ) : (
        <LoginScreen onLogin={setUser} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../auth/AuthContext';
import type { AuthTokenResponse } from '../types';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from || '/search';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Ingresa tu email y contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<AuthTokenResponse>('/auth/login', {
        email: email.trim(),
        password,
      });
      await login(res.data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Credenciales incorrectas.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card form-card">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@example.com"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="alert alert-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

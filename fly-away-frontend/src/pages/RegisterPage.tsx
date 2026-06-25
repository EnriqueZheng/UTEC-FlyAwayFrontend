import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import type { NewIdResponse } from '../types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation: no empty fields before hitting the backend.
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<NewIdResponse>('/users/register', {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
      setSuccess('¡Cuenta creada! Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo registrar el usuario.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card form-card">
      <h1>Crear cuenta</h1>
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
          Nombre
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Alice"
          />
        </label>
        <label>
          Apellido
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8, 1 mayúscula y 1 dígito"
          />
        </label>

        {error && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../auth/AuthContext';
import { addBookingId } from '../bookings';
import { formatDateTime, toIsoUtc } from '../format';
import type { Flight, FlightSearchResponse, NewIdResponse } from '../types';

export default function SearchPage() {
  const { isAuthenticated } = useAuth();

  const [flightNumber, setFlightNumber] = useState('');
  const [airlineName, setAirlineName] = useState('');
  const [departFrom, setDepartFrom] = useState('');
  const [departTo, setDepartTo] = useState('');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Per-flight booking feedback keyed by flight id.
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<
    Record<number, { type: 'success' | 'error'; message: string }>
  >({});

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBookingFeedback({});
    try {
      const params: Record<string, string> = {};
      if (flightNumber.trim()) params.flightNumber = flightNumber.trim();
      if (airlineName.trim()) params.airlineName = airlineName.trim();
      if (departFrom) params.estDepartureTimeFrom = toIsoUtc(departFrom);
      if (departTo) params.estDepartureTimeTo = toIsoUtc(departTo);

      const res = await api.get<FlightSearchResponse>('/flights/search', { params });
      setFlights(res.data.items ?? []);
      setSearched(true);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo realizar la búsqueda.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(flightId: number) {
    setBookingId(flightId);
    setBookingFeedback((prev) => {
      const next = { ...prev };
      delete next[flightId];
      return next;
    });
    try {
      const res = await api.post<NewIdResponse>('/flights/book', { flightId });
      addBookingId(res.data.id);
      setBookingFeedback((prev) => ({
        ...prev,
        [flightId]: { type: 'success', message: `Reserva creada (ID #${res.data.id}).` },
      }));
    } catch (err) {
      setBookingFeedback((prev) => ({
        ...prev,
        [flightId]: { type: 'error', message: errorMessage(err, 'No se pudo reservar.') },
      }));
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div>
      <h1>Buscar vuelos</h1>

      <form className="card search-form" onSubmit={handleSearch}>
        <div className="search-row">
          <label>
            Número de vuelo
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="LA101"
            />
          </label>
          <label>
            Aerolínea
            <input
              type="text"
              value={airlineName}
              onChange={(e) => setAirlineName(e.target.value)}
              placeholder="LATAM"
            />
          </label>
        </div>
        <div className="search-row">
          <label>
            Salida desde
            <input
              type="datetime-local"
              value={departFrom}
              onChange={(e) => setDepartFrom(e.target.value)}
            />
          </label>
          <label>
            Salida hasta
            <input
              type="datetime-local"
              value={departTo}
              onChange={(e) => setDepartTo(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}

      {searched && flights.length === 0 && !error && (
        <p className="empty-state">No se encontraron vuelos con esos criterios. 🛬</p>
      )}

      {flights.length > 0 && (
        <table className="flights-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Aerolínea</th>
              <th>Salida</th>
              <th>Llegada</th>
              <th>Asientos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => {
              const feedback = bookingFeedback[f.id];
              return (
                <tr key={f.id}>
                  <td>{f.flightNumber}</td>
                  <td>{f.airlineName}</td>
                  <td>{formatDateTime(f.estDepartureTime)}</td>
                  <td>{formatDateTime(f.estArrivalTime)}</td>
                  <td>{f.availableSeats}</td>
                  <td>
                    {isAuthenticated ? (
                      <button
                        className="small-button"
                        onClick={() => handleBook(f.id)}
                        disabled={bookingId === f.id}
                      >
                        {bookingId === f.id ? 'Reservando...' : 'Reservar'}
                      </button>
                    ) : (
                      <Link to="/login" className="muted-link">
                        Inicia sesión para reservar
                      </Link>
                    )}
                    {feedback && (
                      <div
                        className={
                          feedback.type === 'success'
                            ? 'inline-success'
                            : 'inline-error'
                        }
                      >
                        {feedback.message}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

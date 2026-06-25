import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AxiosResponse } from 'axios';
import api, { errorMessage } from '../api';
import { getBookingIds } from '../bookings';
import { formatDateTime } from '../format';
import type { Booking, Flight } from '../types';


type BookingWithAirline = Booking & { airlineName?: string };

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = getBookingIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    // Fetch each saved booking by id (no list endpoint exists on the backend).
    Promise.allSettled(ids.map((id) => api.get<Booking>(`/flights/book/${id}`)))
      .then(async (results) => {
        if (cancelled) return;
        const ok = results
          .filter(
            (r): r is PromiseFulfilledResult<AxiosResponse<Booking>> =>
              r.status === 'fulfilled'
          )
          .map((r) => r.value.data);

        // Enrich with the airline name from the flight, tolerating failures.
        const enriched = await Promise.all(
          ok.map(async (b): Promise<BookingWithAirline> => {
            try {
              const flight = await api.get<Flight>(`/flights/${b.flightId}`);
              return { ...b, airlineName: flight.data.airlineName };
            } catch {
              return { ...b };
            }
          })
        );
        if (cancelled) return;
        setBookings(enriched);

        const anyFailed = results.some((r) => r.status === 'rejected');
        if (anyFailed && ok.length === 0) {
          setError('No se pudieron cargar tus reservas.');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Cargando tus reservas...</p>;

  return (
    <div>
      <h1>Mis reservas</h1>

      {error && <p className="alert alert-error">{error}</p>}

      {bookings.length === 0 && !error && (
        <p className="empty-state">Aún no tienes reservas. ¡Busca un vuelo y reserva! ✈️</p>
      )}

      {bookings.length > 0 && (
        <table className="flights-table">
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Vuelo</th>
              <th>Aerolínea</th>
              <th>Salida</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td>{b.flightNumber}</td>
                <td>{b.airlineName ?? '—'}</td>
                <td>{formatDateTime(b.estDepartureTime)}</td>
                <td>
                  <Link to={`/bookings/${b.id}`} className="muted-link">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

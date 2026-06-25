import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { formatDateTime } from '../format';
import type { Booking } from '../types';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get<Booking>(`/flights/book/${id}`)
      .then((res) => {
        if (!cancelled) setBooking(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'No se encontró la reserva.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p>Cargando reserva...</p>;

  return (
    <div className="card detail-card">
      <Link to="/my-bookings" className="muted-link">
        ← Volver a mis reservas
      </Link>
      <h1>Reserva #{id}</h1>

      {error && <p className="alert alert-error">{error}</p>}

      {booking && (
        <dl className="detail-list">
          <dt>Vuelo</dt>
          <dd>{booking.flightNumber}</dd>
          <dt>Salida</dt>
          <dd>{formatDateTime(booking.estDepartureTime)}</dd>
          <dt>Llegada</dt>
          <dd>{formatDateTime(booking.estArrivalTime)}</dd>
          <dt>Fecha de reserva</dt>
          <dd>{formatDateTime(booking.bookingDate)}</dd>
          <dt>Pasajero</dt>
          <dd>
            {booking.customerFirstName} {booking.customerLastName}
          </dd>
        </dl>
      )}
    </div>
  );
}

// El backend en GET /users/current devuelve UserNoPasswordDTO,
// que solo expone id, username y role (sin firstName/lastName/email).
export interface CurrentUser {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface Flight {
  id: number;
  airlineName: string;
  flightNumber: string;
  estDepartureTime: string; // ISO-8601
  estArrivalTime: string; // ISO-8601
  availableSeats: number;
}

export interface FlightSearchResponse {
  items: Flight[];
}

export interface Booking {
  id: number;
  bookingDate: string;
  flightId: number;
  flightNumber: string;
  estDepartureTime: string;
  estArrivalTime: string;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
}

export interface NewIdResponse {
  id: number;
}

export interface AuthTokenResponse {
  token: string;
}

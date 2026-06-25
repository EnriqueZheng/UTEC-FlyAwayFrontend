// Nombres de los usuarios sembrados por el backend (DataInitializer).
// El backend no expone el firstName en /users/current, así que los
// replicamos aquí para poder saludar a estos usuarios por su nombre.
export const SEED_NAMES: Record<string, string> = {
  'ana.garcia@utec.edu.pe': 'Ana',
  'carlos.lopez@utec.edu.pe': 'Carlos',
  'maria.torres@utec.edu.pe': 'Maria',
  'diego.ramirez@utec.edu.pe': 'Diego',
  'lucia.flores@utec.edu.pe': 'Lucia',
};

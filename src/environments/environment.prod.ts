export const environment = {
  // Indica entorno de producción
  production: true,

  // Se reemplaza durante el build Docker mediante --build-arg API_URL.
  // No publicar el placeholder sin proporcionar la URL real del backend.
  apiUrl: 'http://localhost:8081/api',

  // Clave publica de Google reCAPTCHA v2 Checkbox. Reemplazar al configurar el entorno.
  RECAPTCHA_SITE_KEY: '6LdG2c0tAAAAALV-9EXvxHGzCKWJuvYnwhZO0J-_'
};

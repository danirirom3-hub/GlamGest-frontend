# Endpoint de desbloqueo

El frontend ya integra `POST /api/auth/unlock` con el token JWT actual y el cuerpo:

```json
{ "password": "contraseña-del-usuario" }
```

El backend debe implementar este endpoint. Debe responder con éxito cuando la contraseña
del usuario autenticado sea válida y con HTTP `401` cuando sea incorrecta. Los demás
errores de conexión o servidor se muestran al usuario sin cerrar automáticamente la sesión.

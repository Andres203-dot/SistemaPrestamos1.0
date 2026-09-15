# PrestamosUDC

Aplicación web para gestionar clientes, préstamos y pagos de una cartera de crédito. El proyecto combina un frontend estático con HTML, CSS y JavaScript, y un backend en Node.js con Express que se conecta a MySQL para persistir los datos.

## Descripción general

La aplicación permite:

- Registrar clientes con datos básicos como nombre, documento, teléfono, correo y dirección.
- Crear y consultar préstamos asociados a un cliente.
- Definir montos, interés, plazo, frecuencia, fecha de inicio y fecha de vencimiento.
- Registrar pagos realizados sobre cada préstamo.
- Visualizar estadísticas del estado financiero de la cartera.
- Mantener sincronización entre el frontend y la base de datos mediante la API REST `/api/data`.

## Stack tecnológico

- Frontend: HTML, CSS y JavaScript puro
- Backend: Node.js + Express
- Base de datos: MySQL
- Conexión DB: mysql2
- Variables de entorno: dotenv
- CORS: habilitado para consumo del frontend

## Requisitos

- Node.js 18 o superior
- MySQL 8 o superior
- Acceso a un servidor MySQL local o remoto
- Navegador moderno para consumir la interfaz web

## Estructura del proyecto

- `server.js`: configuración del servidor Express y endpoints de la API.
- `schema.sql`: script SQL para crear la base de datos y tablas.
- `App.js`: lógica del frontend, renderizado y gestión de datos.
- `index.html`: interfaz principal de la aplicación.
- `Style.css`: estilos visuales del sistema.
- `.env.example`: ejemplo de variables de entorno.

## Instalación

1. Clona o descarga el proyecto y entra a la carpeta.

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea la base de datos y las tablas ejecutando el script SQL:

   ```bash
   mysql -u root -p < schema.sql
   ```

   Si prefieres hacerlo desde MySQL Workbench o un cliente gráfico, ejecuta el contenido de `schema.sql` directamente.

4. Crea un archivo `.env` a partir del ejemplo:

   ```bash
   copy .env.example .env
   ```

   Luego ajusta los valores según tu entorno:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=prestamosudc
   DB_USER=root
   DB_PASSWORD=tu_password
   ```

5. Inicia la aplicación:

   ```bash
   npm start
   ```

6. Abre en el navegador:

   ```text
   http://localhost:3000
   ```

## Configuración de la base de datos

La base de datos por defecto se llama `prestamosudc` y se crea automáticamente con el script de SQL.

### Script de creación

El archivo [schema.sql](schema.sql) contiene lo siguiente:

- Creación de la base de datos `prestamosudc`
- Uso de la base de datos
- Definición de las tablas `clients`, `loans` y `payments`
- Relación entre préstamos y clientes
- Relación entre pagos y préstamos
- Restricciones de integridad referencial con `FOREIGN KEY`
- Unicidad del documento del cliente

## Documentación de la base de datos

### 1. Tabla `clients`

Representa a los clientes del sistema.

Campos:

- `id` (BIGINT): identificador principal del cliente.
- `name` (VARCHAR(150)): nombre completo del cliente. Es obligatorio.
- `document` (VARCHAR(50)): número de documento. Es obligatorio y único.
- `phone` (VARCHAR(50)): teléfono de contacto; puede ser nulo.
- `email` (VARCHAR(150)): correo electrónico; puede ser nulo.
- `address` (VARCHAR(255)): dirección; puede ser nula.

Restricciones:

- `PRIMARY KEY` en `id`
- `UNIQUE KEY uq_clients_document` en `document`

Uso en la app:

- Se usa para registrar personas a las que se les otorga crédito.
- Cada préstamo apunta a un cliente mediante `client_id`.

### 2. Tabla `loans`

Representa cada préstamo otorgado.

Campos:

- `id` (BIGINT): identificador del préstamo.
- `client_id` (BIGINT): referencia al cliente que recibe el préstamo. No puede ser nulo.
- `amount` (DECIMAL(15,2)): monto principal prestado.
- `interest` (DECIMAL(8,2)): tasa de interés aplicada.
- `term` (INT): plazo del préstamo, expresado en meses o periodos según la lógica de negocio.
- `frequency` (VARCHAR(30)): frecuencia de pago, por ejemplo `Mensual`.
- `total` (DECIMAL(15,2)): monto total con intereses.
- `installment` (DECIMAL(15,2)): valor del pago periódico.
- `start_date` (DATE): fecha de inicio del crédito.
- `due_date` (DATE): fecha estimada de vencimiento.
- `status` (ENUM('Activo', 'Vencido', 'Cancelado')): estado del préstamo.

Restricciones:

- `PRIMARY KEY` en `id`
- `FOREIGN KEY (client_id)` referencia a `clients(id)` con `ON DELETE CASCADE`

Uso en la app:

- Un préstamo pertenece a un cliente.
- El estado condiciona el cálculo de los reportes y el dashboard.
- El saldo pendiente se calcula como `total - pagos realizados`.

### 3. Tabla `payments`

Representa cada abono o pago efectuado sobre un préstamo.

Campos:

- `id` (BIGINT): identificador del pago.
- `loan_id` (BIGINT): préstamo asociado. No puede ser nulo.
- `amount` (DECIMAL(15,2)): valor del pago.
- `payment_date` (DATE): fecha en que se registra el pago.
- `note` (VARCHAR(255)): nota opcional del pago.

Restricciones:

- `PRIMARY KEY` en `id`
- `FOREIGN KEY (loan_id)` referencia a `loans(id)` con `ON DELETE CASCADE`

Uso en la app:

- Permite registrar cada cuota o abono.
- Se usa para calcular el saldo pendiente y las estadísticas.

## Relaciones entre tablas

La relación general es:

- Un cliente puede tener muchos préstamos.
- Un préstamo pertenece a un cliente.
- Un préstamo puede tener muchos pagos.
- Un pago pertenece a un préstamo.

Diagrama lógico:

```text
clients 1 ---- N loans 1 ---- N payments
```

## API REST

El backend expone la siguiente API principal:

### GET `/api/data`

Obtiene todos los registros en formato JSON.

Respuesta esperada:

```json
{
  "clients": [],
  "loans": [],
  "payments": []
}
```

### PUT `/api/data`

Recibe un payload con clientes, préstamos y pagos para reemplazar el contenido completo de la base de datos dentro de una transacción.

Flujo interno:

1. Elimina pagos
2. Elimina préstamos
3. Elimina clientes
4. Inserta clientes
5. Inserta préstamos
6. Inserta pagos
7. Confirma la transacción

Esto permite sincronizar el estado del frontend con MySQL.

## Reglas de negocio importantes

- Toda carga y actualización de datos se hace a través del backend.
- El frontend no guarda directamente la información en MySQL.
- Si la base de datos está vacía, la aplicación intenta restaurar un conjunto de datos demo.
- Si existen datos antiguos en `localStorage`, se migran a MySQL al iniciar la aplicación.
- Para el cálculo del saldo se usa:

  ```text
  saldo = total del préstamo - sumatoria de pagos realizados
  ```

- Los estados posibles de un préstamo son `Activo`, `Vencido` y `Cancelado`.

## Buenas prácticas recomendadas

- Mantener copias de seguridad periódicas de la base de datos.
- Evitar guardar contraseñas o tokens sensibles en el frontend.
- Usar un usuario de MySQL con permisos restringidos en producción.
- Revisar y documentar cambios en el modelo de datos cuando se agreguen nuevas funcionalidades.

## Comandos útiles

Instalar dependencias:

```bash
npm install
```

Iniciar la aplicación:

```bash
npm start
```

Modo desarrollo con recarga automática:

```bash
npm run dev
```

## Nota importante

La conexión a la base de datos se define en el backend en [server.js](server.js), y la estructura real del esquema se encuentra en [schema.sql](schema.sql). Este README refleja la implementación actual del proyecto y debe mantenerse actualizado al modificar el modelo de datos.

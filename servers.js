require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "prestamosudc",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/data", async (request, response) => {
    try {
        const [clients] = await pool.query(
            "SELECT id, name, document, phone, email, address FROM clients ORDER BY id"
        );
        const [loans] = await pool.query(
            "SELECT id, client_id AS clientId, amount, interest, term, frequency, total, installment, start_date AS start, due_date AS due, status FROM loans ORDER BY id"
        );
        const [payments] = await pool.query(
            "SELECT id, loan_id AS loanId, amount, payment_date AS date, note FROM payments ORDER BY id"
        );

        response.json({ clients, loans, payments });
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: "No fue posible cargar los datos" });
    }
});

app.put("/api/data", async (request, response) => {
    const { clients = [], loans = [], payments = [] } = request.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM payments");
        await connection.query("DELETE FROM loans");
        await connection.query("DELETE FROM clients");

        for (const client of clients) {
            await connection.query(
                "INSERT INTO clients (id, name, document, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)",
                [client.id, client.name, client.document, client.phone || null, client.email || null, client.address || null]
            );
        }

        for (const loan of loans) {
            await connection.query(
                "INSERT INTO loans (id, client_id, amount, interest, term, frequency, total, installment, start_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [loan.id, loan.clientId, loan.amount, loan.interest, loan.term, loan.frequency, loan.total, loan.installment, loan.start, loan.due, loan.status]
            );
        }

        for (const payment of payments) {
            await connection.query(
                "INSERT INTO payments (id, loan_id, amount, payment_date, note) VALUES (?, ?, ?, ?, ?)",
                [payment.id, payment.loanId, payment.amount, payment.date, payment.note || null]
            );
        }

        await connection.commit();
        response.status(204).end();
    } catch (error) {
        await connection.rollback();
        console.error(error);
        response.status(500).json({ error: "No fue posible guardar los datos" });
    } finally {
        connection.release();
    }
});

app.listen(port, () => {
    console.log(`PrestamosUDC disponible en http://localhost:${port}`);
});

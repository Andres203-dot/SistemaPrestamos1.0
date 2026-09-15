CREATE DATABASE IF NOT EXISTS prestamosudc
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE prestamosudc;

CREATE TABLE IF NOT EXISTS clients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    document VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    address VARCHAR(255),
    UNIQUE KEY uq_clients_document (document)
);

CREATE TABLE IF NOT EXISTS loans (
    id BIGINT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    interest DECIMAL(8, 2) NOT NULL,
    term INT NOT NULL,
    frequency VARCHAR(30) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    installment DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Activo', 'Vencido', 'Cancelado') NOT NULL DEFAULT 'Activo',
    CONSTRAINT fk_loans_client FOREIGN KEY (client_id)
        REFERENCES clients (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    note VARCHAR(255),
    CONSTRAINT fk_payments_loan FOREIGN KEY (loan_id)
        REFERENCES loans (id) ON DELETE CASCADE
);

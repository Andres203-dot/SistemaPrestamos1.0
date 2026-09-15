/* =====================================================
   CONFIGURACIÓN
===================================================== */

const API_URL = "/api/data";
const LEGACY_STORAGE_KEY = "prestamoflow_ihc";


let data = {

    clients: [],

    loans: [],

    payments: []

};


let currentFilter = "Todos";


/* =====================================================
   FUNCIONES GENERALES
===================================================== */

const $ = id =>
    document.getElementById(id);


const money = value => {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0);

};


const today = () =>
    new Date()
        .toISOString()
        .slice(0, 10);


const generateId = () =>
    Date.now() +
    Math.floor(Math.random() * 1000);


const formatDate = date => {

    if (!date) {
        return "—";
    }

    return new Date(date + "T12:00:00")
        .toLocaleDateString(
            "es-CO",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

};


const safe = value => {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char])
        );

};


/* =====================================================
   LOCAL STORAGE
===================================================== */

async function saveData() {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );


        if (!response.ok) {
            throw new Error("No fue posible guardar los datos");
        }

    }

    catch (error) {

        console.error("Error guardando datos", error);
        showMessage("No se pudo guardar en la base de datos");

    }

}


async function loadData() {

    try {

        const response = await fetch(API_URL);


        if (!response.ok) {
            throw new Error("No fue posible cargar los datos");
        }


        data = await response.json();


        if (data.clients.length === 0) {
            const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);

            if (legacyData) {
                data = JSON.parse(legacyData);
                await saveData();
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                renderAll();
                showMessage("Datos anteriores migrados a MySQL");
                return;
            }

            restoreDemo(true);
            return;
        }


        renderAll();

    }

    catch (error) {

        console.error("Error conectando con la base de datos", error);
        renderAll();
        showMessage("No se pudo conectar con la base de datos");

    }

}


/* =====================================================
   DATOS DEMO
===================================================== */

function restoreDemo(silent = false) {

    data = {

        clients: [

            {
                id: 1,
                name: "Carlos Rodríguez",
                document: "1001234567",
                phone: "3001234567",
                email: "carlos@email.com",
                address: "Bogotá"
            },

            {
                id: 2,
                name: "Laura Martínez",
                document: "1007654321",
                phone: "3017654321",
                email: "laura@email.com",
                address: "Medellín"
            },

            {
                id: 3,
                name: "Andrés Gómez",
                document: "1012345678",
                phone: "3105551234",
                email: "andres@email.com",
                address: "Cali"
            },

            {
                id: 4,
                name: "Mariana Torres",
                document: "1023344556",
                phone: "3157778899",
                email: "mariana@email.com",
                address: "Cartagena"
            }

        ],


        loans: [

            {
                id: 101,
                clientId: 1,
                amount: 2500000,
                interest: 8,
                term: 10,
                frequency: "Mensual",
                total: 2700000,
                installment: 270000,
                start: "2026-07-01",
                due: "2027-04-01",
                status: "Activo"
            },

            {
                id: 102,
                clientId: 2,
                amount: 1800000,
                interest: 10,
                term: 12,
                frequency: "Mensual",
                total: 1980000,
                installment: 165000,
                start: "2026-06-15",
                due: "2027-05-15",
                status: "Activo"
            },

            {
                id: 103,
                clientId: 3,
                amount: 900000,
                interest: 5,
                term: 6,
                frequency: "Mensual",
                total: 945000,
                installment: 157500,
                start: "2026-01-01",
                due: "2026-06-01",
                status: "Vencido"
            },

            {
                id: 104,
                clientId: 4,
                amount: 1200000,
                interest: 6,
                term: 8,
                frequency: "Mensual",
                total: 1272000,
                installment: 159000,
                start: "2026-05-01",
                due: "2027-01-01",
                status: "Activo"
            }

        ],


        payments: [

            {
                id: 201,
                loanId: 101,
                amount: 270000,
                date: "2026-08-01",
                note: "Cuota 1"
            },

            {
                id: 202,
                loanId: 102,
                amount: 165000,
                date: "2026-07-15",
                note: "Cuota 1"
            },

            {
                id: 203,
                loanId: 103,
                amount: 315000,
                date: "2026-02-01",
                note: "Cuotas 1 y 2"
            },

            {
                id: 204,
                loanId: 104,
                amount: 159000,
                date: "2026-06-01",
                note: "Cuota 1"
            }

        ]

    };


    saveData();

    renderAll();


    if (!silent) {

        showMessage(
            "Datos demo restaurados"
        );

    }

}


/* =====================================================
   CONSULTAS
===================================================== */

function getClient(id) {

    return data.clients.find(
        client =>
            client.id == id
    );

}


function getLoan(id) {

    return data.loans.find(
        loan =>
            loan.id == id
    );

}


function getPaidAmount(loanId) {

    return data.payments

        .filter(
            payment =>
                payment.loanId == loanId
        )

        .reduce(
            (total, payment) =>
                total +
                Number(payment.amount),

            0
        );

}


function getBalance(loan) {

    return Math.max(
        Number(loan.total)
        -
        getPaidAmount(loan.id),

        0
    );

}


/* =====================================================
   ACTUALIZAR TODO
===================================================== */

function renderAll() {

    renderStats();

    renderClients();

    renderLoans();

    renderPayments();

    renderReports();

}


/* =====================================================
   DASHBOARD
===================================================== */

function renderStats() {

    const totalCapital =
        data.loans.reduce(
            (total, loan) =>
                total +
                loan.amount,

            0
        );


    const saldoPendiente =
        data.loans.reduce(
            (total, loan) =>
                total +
                getBalance(loan),

            0
        );


    const activos =
        data.loans.filter(
            loan =>
                loan.status === "Activo"
                &&
                getBalance(loan) > 0
        ).length;


    const vencidos =
        data.loans.filter(
            loan =>
                loan.status === "Vencido"
                &&
                getBalance(loan) > 0
        ).length;


    const tarjetas = [

        [
            "Clientes",
            data.clients.length,
            "👥",
            "Registros actuales"
        ],

        [
            "Préstamos activos",
            activos,
            "◉",
            `${vencidos} vencidos`
        ],

        [
            "Capital prestado",
            money(totalCapital),
            "↗",
            "Capital colocado"
        ],

        [
            "Saldo pendiente",
            money(saldoPendiente),
            "▣",
            "Por cobrar"
        ]

    ];


    $("stats").innerHTML =

        tarjetas.map(
            tarjeta => `

                <div class="stat">

                    <div class="stat-top">

                        <span>
                            ${tarjeta[0]}
                        </span>

                        <span class="stat-icon">
                            ${tarjeta[2]}
                        </span>

                    </div>

                    <div class="stat-value">
                        ${tarjeta[1]}
                    </div>

                    <div class="stat-note">
                        ${tarjeta[3]}
                    </div>

                </div>
            `
        ).join("");

}


/* =====================================================
   CLIENTES
===================================================== */

function renderClients() {

    const search =
        (
            $("clientSearch")?.value
            || ""
        )
            .toLowerCase();


    const clients =
        data.clients.filter(
            client => {

                const text = `

                    ${client.name}

                    ${client.document}

                    ${client.phone}

                    ${client.email}

                `.toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    $("clientCounter")
        .textContent =
        `${clients.length} cliente(s)`;


    if (
        clients.length === 0
    ) {

        $("clientsBody").innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty"
                >
                    No se encontraron clientes.
                </td>

            </tr>

        `;

        return;

    }


    $("clientsBody").innerHTML =

        clients.map(
            client => {

                const numberLoans =
                    data.loans.filter(
                        loan =>
                            loan.clientId
                            ==
                            client.id
                    ).length;


                return `

                    <tr>

                        <td>

                            <span class="name">
                                ${safe(client.name)}
                            </span>

                            <span class="sub">
                                ${safe(client.address)}
                            </span>

                        </td>


                        <td>
                            ${safe(
                                client.document
                            )}
                        </td>


                        <td>

                            ${safe(
                                client.phone
                            )}

                            <span class="sub">
                                ${safe(
                                    client.email
                                )}
                            </span>

                        </td>


                        <td>
                            ${numberLoans}
                        </td>


                        <td>

                            <div class="actions">

                                <button
                                    class="action"
                                    onclick="editClient(${client.id})"
                                >
                                    Editar
                                </button>


                                <button
                                    class="action"
                                    onclick="deleteClient(${client.id})"
                                >
                                    Eliminar
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =====================================================
   MODAL CLIENTES
===================================================== */

function openClientModal() {

    $("clientForm").reset();

    $("clientId").value = "";

    $("clientTitle")
        .textContent =
        "Agregar cliente";


    openModal(
        "clientModal"
    );

}


function editClient(id) {

    const client =
        getClient(id);


    if (!client) return;


    $("clientId").value =
        client.id;


    $("clientName").value =
        client.name;


    $("clientDocument").value =
        client.document;


    $("clientPhone").value =
        client.phone;


    $("clientEmail").value =
        client.email;


    $("clientAddress").value =
        client.address;


    $("clientTitle")
        .textContent =
        "Editar cliente";


    openModal(
        "clientModal"
    );

}


/* =====================================================
   GUARDAR CLIENTE
===================================================== */

$("clientForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const id =
                Number(
                    $("clientId").value
                );


            const client = {

                id:
                    id ||
                    generateId(),

                name:
                    $("clientName")
                        .value
                        .trim(),

                document:
                    $("clientDocument")
                        .value
                        .trim(),

                phone:
                    $("clientPhone")
                        .value
                        .trim(),

                email:
                    $("clientEmail")
                        .value
                        .trim(),

                address:
                    $("clientAddress")
                        .value
                        .trim()

            };


            if (id) {

                data.clients =
                    data.clients.map(
                        oldClient =>

                            oldClient.id === id
                                ? client
                                : oldClient
                    );

            }

            else {

                data.clients.push(
                    client
                );

            }


            saveData();

            renderAll();

            closeModal(
                "clientModal"
            );


            showMessage(
                id
                    ? "Cliente actualizado"
                    : "Cliente registrado"
            );

        }
    );


/* =====================================================
   ELIMINAR CLIENTE
===================================================== */

function deleteClient(id) {

    const loans =
        data.loans.filter(
            loan =>
                loan.clientId == id
        );


    if (
        !confirm(
            loans.length
                ? "Este cliente tiene préstamos. ¿Deseas eliminar también sus préstamos y pagos?"
                : "¿Eliminar este cliente?"
        )
    ) {

        return;

    }


    const loanIds =
        loans.map(
            loan =>
                loan.id
        );


    data.clients =
        data.clients.filter(
            client =>
                client.id != id
        );


    data.loans =
        data.loans.filter(
            loan =>
                loan.clientId != id
        );


    data.payments =
        data.payments.filter(
            payment =>
                !loanIds.includes(
                    payment.loanId
                )
        );


    saveData();

    renderAll();


    showMessage(
        "Cliente eliminado"
    );

}


/* =====================================================
   PRÉSTAMOS
===================================================== */

function openLoanModal() {

    if (
        data.clients.length === 0
    ) {

        showMessage(
            "Primero debes registrar un cliente"
        );

        openClientModal();

        return;

    }


    $("loanClient").innerHTML =

        data.clients.map(
            client => `

                <option value="${client.id}">

                    ${safe(client.name)}

                    ·

                    ${safe(
                        client.document
                    )}

                </option>

            `
        ).join("");


    $("loanForm").reset();


    $("loanStart").value =
        today();


    updateLoanPreview();


    openModal(
        "loanModal"
    );

}


/* =====================================================
   CALCULO DEL PRÉSTAMO
===================================================== */

function updateLoanPreview() {

    const capital =
        Number(
            $("loanAmount").value
            || 0
        );


    const interest =
        Number(
            $("loanInterest").value
            || 0
        );


    const term =
        Number(
            $("loanTerm").value
            || 0
        );


    const interestValue =
        capital *
        (
            interest / 100
        );


    const total =
        capital +
        interestValue;


    const installment =
        term
            ? total / term
            : 0;


    if (!term) {

        $("loanPreview")
            .textContent =
            "Ingresa capital, interés y número de cuotas.";

        return;

    }


    $("loanPreview").innerHTML = `

        Interés:

        <strong>
            ${money(interestValue)}
        </strong>

        ·

        Total:

        <strong>
            ${money(total)}
        </strong>

        ·

        Cuota:

        <strong>
            ${money(installment)}
        </strong>

    `;

}


[
    "loanAmount",
    "loanInterest",
    "loanTerm"
].forEach(
    id => {

        $(id)
            .addEventListener(
                "input",
                updateLoanPreview
            );

    }
);


/* =====================================================
   FECHA DE VENCIMIENTO
===================================================== */

function calculateDueDate(
    date,
    term,
    frequency
) {

    const result =
        new Date(
            date + "T12:00:00"
        );


    if (
        frequency === "Mensual"
    ) {

        result.setMonth(
            result.getMonth() +
            term
        );

    }


    else if (
        frequency === "Quincenal"
    ) {

        result.setDate(
            result.getDate() +
            (
                term * 15
            )
        );

    }


    else {

        result.setDate(
            result.getDate() +
            (
                term * 7
            )
        );

    }


    return result
        .toISOString()
        .slice(0, 10);

}


/* =====================================================
   CREAR PRÉSTAMO
===================================================== */

$("loanForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const capital =
                Number(
                    $("loanAmount")
                        .value
                );


            const interest =
                Number(
                    $("loanInterest")
                        .value
                );


            const term =
                Number(
                    $("loanTerm")
                        .value
                );


            const frequency =
                $("loanFrequency")
                    .value;


            const start =
                $("loanStart")
                    .value;


            const total =
                capital *
                (
                    1 +
                    interest /
                    100
                );


            const installment =
                total /
                term;


            const due =
                calculateDueDate(
                    start,
                    term,
                    frequency
                );


            const loan = {

                id:
                    generateId(),

                clientId:
                    Number(
                        $("loanClient")
                            .value
                    ),

                amount:
                    capital,

                interest:
                    interest,

                term:
                    term,

                frequency:
                    frequency,

                total:
                    total,

                installment:
                    installment,

                start:
                    start,

                due:
                    due,

                status:
                    "Activo"

            };


            data.loans.push(
                loan
            );


            saveData();

            renderAll();


            closeModal(
                "loanModal"
            );


            showMessage(
                "Préstamo creado correctamente"
            );

        }
    );


/* =====================================================
   MOSTRAR PRÉSTAMOS
===================================================== */

function renderLoans() {

    const search =
        (
            $("loanSearch")
                ?.value
            || ""
        ).toLowerCase();


    const loans =
        data.loans.filter(
            loan => {

                const client =
                    getClient(
                        loan.clientId
                    );


                const text = `

                    ${loan.id}

                    ${client?.name || ""}

                    ${client?.document || ""}

                `.toLowerCase();


                return (

                    (
                        currentFilter
                        ===
                        "Todos"
                    ||

                        loan.status
                        ===
                        currentFilter
                    )

                    &&

                    text.includes(
                        search
                    )

                );

            }
        );


    if (
        loans.length === 0
    ) {

        $("loansBody").innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty"
                >
                    No hay préstamos para este filtro.
                </td>

            </tr>

        `;

        return;

    }


    $("loansBody").innerHTML =

        loans.map(
            loan => {

                const client =
                    getClient(
                        loan.clientId
                    );


                return `

                    <tr>

                        <td>

                            <span class="name">

                                #${loan.id}
                                ·
                                ${safe(
                                    client?.name
                                    || "Sin cliente"
                                )}

                            </span>


                            <span class="sub">

                                ${safe(
                                    client?.document
                                    || ""
                                )}

                            </span>

                        </td>


                        <td>
                            ${money(
                                loan.amount
                            )}
                        </td>


                        <td>
                            ${loan.interest}%
                        </td>


                        <td>
                            ${money(
                                loan.installment
                            )}
                        </td>


                        <td>

                            <strong>
                                ${money(
                                    getBalance(
                                        loan
                                    )
                                )}
                            </strong>

                        </td>


                        <td>
                            ${formatDate(
                                loan.due
                            )}
                        </td>


                        <td>

                            <span
                                class="
                                    badge
                                    ${loan.status}
                                "
                            >

                                ${loan.status}

                            </span>

                        </td>


                        <td>

                            <div class="actions">

                                <button
                                    class="action"
                                    onclick="quickPayment(${loan.id})"
                                >
                                    Pagar
                                </button>


                                <button
                                    class="action"
                                    onclick="changeStatus(${loan.id})"
                                >
                                    Estado
                                </button>


                                <button
                                    class="action"
                                    onclick="deleteLoan(${loan.id})"
                                >
                                    ×
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");


    document
        .querySelectorAll(
            ".filter"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter
                    ===
                    currentFilter
                );

            }
        );

}


/* =====================================================
   FILTRO DE PRÉSTAMOS
===================================================== */

function filterLoans(status) {

    currentFilter =
        status;

    renderLoans();

    scrollToId(
        "prestamos"
    );

}


/* =====================================================
   PAGOS
===================================================== */

function openPaymentModal() {

    const available =
        data.loans.filter(
            loan =>
                getBalance(loan)
                > 0
        );


    if (
        available.length === 0
    ) {

        showMessage(
            "No hay préstamos con saldo pendiente"
        );

        return;

    }


    $("paymentLoan").innerHTML =

        available.map(
            loan => `

                <option
                    value="${loan.id}"
                >

                    #${loan.id}

                    ·

                    ${safe(
                        getClient(
                            loan.clientId
                        )?.name
                        ||
                        "Cliente"
                    )}

                    ·

                    ${money(
                        getBalance(
                            loan
                        )
                    )}

                </option>

            `
        ).join("");


    $("paymentForm").reset();


    $("paymentDate").value =
        today();


    updatePaymentPreview();


    openModal(
        "paymentModal"
    );

}


/* =====================================================
   PAGO RÁPIDO
===================================================== */

function quickPayment(id) {

    openPaymentModal();


    setTimeout(
        () => {

            $("paymentLoan").value =
                id;


            updatePaymentPreview();

        },

        50
    );

}


/* =====================================================
   PREVIEW PAGO
===================================================== */

function updatePaymentPreview() {

    const loan =
        getLoan(
            $("paymentLoan").value
        );


    if (!loan) {

        $("paymentPreview")
            .textContent =
            "";

        return;

    }


    $("paymentPreview").innerHTML = `

        Saldo actual:

        <strong>
            ${money(
                getBalance(
                    loan
                )
            )}
        </strong>

        ·

        Cuota:

        <strong>
            ${money(
                loan.installment
            )}
        </strong>

    `;

}


$("paymentLoan")
    .addEventListener(
        "change",
        updatePaymentPreview
    );


/* =====================================================
   REGISTRAR PAGO
===================================================== */

$("paymentForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const loanId =
                Number(
                    $("paymentLoan")
                        .value
                );


            const amount =
                Number(
                    $("paymentAmount")
                        .value
                );


            const loan =
                getLoan(
                    loanId
                );


            if (!loan) {

                showMessage(
                    "Préstamo no encontrado"
                );

                return;

            }


            const balance =
                getBalance(
                    loan
                );


            if (
                amount <= 0
            ) {

                showMessage(
                    "Ingresa un valor válido"
                );

                return;

            }


            if (
                amount > balance
            ) {

                showMessage(
                    "El pago supera el saldo pendiente"
                );

                return;

            }


            data.payments.push({

                id:
                    generateId(),

                loanId:
                    loanId,

                amount:
                    amount,

                date:
                    $("paymentDate")
                        .value,

                note:
                    $("paymentNote")
                        .value
                        .trim()

            });


            if (
                getBalance(loan)
                <=
                0.01
            ) {

                loan.status =
                    "Cancelado";

            }


            saveData();

            renderAll();

            closeModal(
                "paymentModal"
            );


            showMessage(
                "Pago registrado y saldo actualizado"
            );

        }
    );


/* =====================================================
   MOSTRAR PAGOS
===================================================== */

function renderPayments() {

    const collected =
        data.payments.reduce(
            (total, payment) =>
                total +
                payment.amount,

            0
        );


    const pending =
        data.loans.reduce(
            (total, loan) =>
                total +
                getBalance(loan),

            0
        );


    const last =
        data.payments
            .slice()
            .sort(
                (a, b) =>
                    b.date
                    .localeCompare(
                        a.date
                    )
            )[0];


    $("paymentCards")
        .innerHTML = [

            [
                "Total cobrado",
                money(collected)
            ],

            [
                "Saldo pendiente",
                money(pending)
            ],

            [
                "Último pago",
                last
                    ? formatDate(
                        last.date
                    )
                    : "—"
            ]

        ].map(
            item => `

                <div class="payment-card">

                    <span>
                        ${item[0]}
                    </span>

                    <strong>
                        ${item[1]}
                    </strong>

                </div>

            `
        ).join("");


    if (
        data.payments.length === 0
    ) {

        $("paymentsBody")
            .innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty"
                    >
                        No hay pagos registrados.
                    </td>

                </tr>

            `;

        return;

    }


    $("paymentsBody")
        .innerHTML =

        data.payments
            .slice()
            .sort(
                (a, b) =>
                    b.date
                    .localeCompare(
                        a.date
                    )
            )
            .map(
                payment => {

                    const loan =
                        getLoan(
                            payment.loanId
                        );


                    const client =
                        loan
                            ? getClient(
                                loan.clientId
                            )
                            : null;


                    return `

                        <tr>

                            <td class="name">

                                ${safe(
                                    client?.name
                                    ||
                                    "—"
                                )}

                            </td>


                            <td>

                                #${payment.loanId}

                            </td>


                            <td>

                                <strong>

                                    ${money(
                                        payment.amount
                                    )}

                                </strong>

                            </td>


                            <td>

                                ${formatDate(
                                    payment.date
                                )}

                            </td>


                            <td>

                                ${safe(
                                    payment.note
                                )}

                            </td>


                            <td>

                                <button
                                    class="action"
                                    onclick="deletePayment(${payment.id})"
                                >
                                    Eliminar
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   ELIMINAR PAGO
===================================================== */

function deletePayment(id) {

    if (
        !confirm(
            "¿Eliminar este pago?"
        )
    ) {

        return;

    }


    data.payments =
        data.payments.filter(
            payment =>
                payment.id != id
        );


    saveData();

    renderAll();


    showMessage(
        "Pago eliminado"
    );

}


/* =====================================================
   ESTADO
===================================================== */

function changeStatus(id) {

    const loan =
        getLoan(id);


    const status =
        prompt(
            "Escribe: Activo, Vencido o Cancelado",
            loan.status
        );


    if (
        ![
            "Activo",
            "Vencido",
            "Cancelado"
        ].includes(status)
    ) {

        return;

    }


    loan.status =
        status;


    saveData();

    renderAll();


    showMessage(
        "Estado actualizado"
    );

}


/* =====================================================
   ELIMINAR PRÉSTAMO
===================================================== */

function deleteLoan(id) {

    if (
        !confirm(
            "¿Eliminar este préstamo y sus pagos?"
        )
    ) {

        return;

    }


    data.loans =
        data.loans.filter(
            loan =>
                loan.id != id
        );


    data.payments =
        data.payments.filter(
            payment =>
                payment.loanId != id
        );


    saveData();

    renderAll();


    showMessage(
        "Préstamo eliminado"
    );

}


/* =====================================================
   REPORTES
===================================================== */

function renderReports() {

    const activos =
        data.loans.filter(
            loan =>
                loan.status === "Activo"
        ).length;


    const vencidos =
        data.loans.filter(
            loan =>
                loan.status === "Vencido"
        ).length;


    const cancelados =
        data.loans.filter(
            loan =>
                loan.status === "Cancelado"
        ).length;


    const maximum =
        Math.max(
            activos,
            vencidos,
            cancelados,
            1
        );


    $("reportTotal")
        .textContent =
        `${data.loans.length} préstamos`;


    $("chart")
        .innerHTML = [

            [
                "Activos",
                activos,
                "green"
            ],

            [
                "Vencidos",
                vencidos,
                "red"
            ],

            [
                "Cancelados",
                cancelados,
                "gray"
            ]

        ].map(
            item => `

                <div class="bar-col">

                    <div
                        class="
                            bar
                            ${item[2]}
                        "
                        style="
                            height:
                            ${Math.max(
                                8,
                                (
                                    item[1] /
                                    maximum
                                ) * 115
                            )}px
                        "
                    >
                    </div>


                    <strong>
                        ${item[1]}
                    </strong>


                    <span>
                        ${item[0]}
                    </span>

                </div>

            `
        ).join("");


    let notifications = "";


    data.loans
        .filter(
            loan =>
                loan.status ===
                "Vencido"
                &&
                getBalance(loan)
                > 0
        )
        .forEach(
            loan => {

                notifications += `

                    <div class="
                        notice
                        overdue
                    ">

                        <strong>
                            ⚠️ Préstamo #${loan.id}
                            vencido
                        </strong>

                        <span>

                            ${safe(
                                getClient(
                                    loan.clientId
                                )?.name
                                ||
                                "Cliente"
                            )}

                            · Saldo:

                            ${money(
                                getBalance(
                                    loan
                                )
                            )}

                            · Venció:

                            ${formatDate(
                                loan.due
                            )}

                        </span>

                    </div>

                `;

            }
        );


    data.loans
        .filter(
            loan =>
                loan.status ===
                "Activo"
        )
        .slice(0, 4)
        .forEach(
            loan => {

                notifications += `

                    <div class="
                        notice
                    ">

                        <strong>
                            🔔 Seguimiento #${loan.id}
                        </strong>

                        <span>

                            ${safe(
                                getClient(
                                    loan.clientId
                                )?.name
                                ||
                                "Cliente"
                            )}

                            · Saldo:

                            ${money(
                                getBalance(
                                    loan
                                )
                            )}

                            · Vence:

                            ${formatDate(
                                loan.due
                            )}

                        </span>

                    </div>

                `;

            }
        );


    if (
        notifications === ""
    ) {

        notifications = `

            <div class="notice">

                <strong>
                    ✓ Sin alertas
                </strong>

                <span>
                    No hay recordatorios pendientes.
                </span>

            </div>

        `;

    }


    $("notifications")
        .innerHTML =
        notifications;

}


/* =====================================================
   BUSCAR
===================================================== */

function globalSearch(value) {

    const search =
        value
            .trim()
            .toLowerCase();


    if (
        search === ""
    ) {

        return;

    }


    const clientMatch =
        data.clients.find(
            client => {

                const text = `

                    ${client.name}

                    ${client.document}

                    ${client.phone}

                `.toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    const loanMatch =
        data.loans.find(
            loan => {

                const client =
                    getClient(
                        loan.clientId
                    );


                const text = `

                    ${loan.id}

                    ${client?.name || ""}

                `.toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    if (clientMatch) {

        scrollToId(
            "clientes"
        );


        $("clientSearch")
            .value =
            value;


        renderClients();

    }


    else if (loanMatch) {

        scrollToId(
            "prestamos"
        );


        $("loanSearch")
            .value =
            value;


        renderLoans();

    }


}


/* =====================================================
   EXPORTAR CSV
===================================================== */

function exportCSV() {

    const rows = [

        [
            "ID",
            "Cliente",
            "Documento",
            "Capital",
            "Interés",
            "Total",
            "Pagado",
            "Saldo",
            "Vencimiento",
            "Estado"
        ]

    ];


    data.loans.forEach(
        loan => {

            const client =
                getClient(
                    loan.clientId
                );


            rows.push([

                loan.id,

                client?.name ||
                "",

                client?.document ||
                "",

                loan.amount,

                loan.interest,

                loan.total,

                getPaidAmount(
                    loan.id
                ),

                getBalance(
                    loan
                ),

                loan.due,

                loan.status

            ]);

        }
    );


    const csv =
        "\ufeff" +
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                ).replaceAll(
                                    '"',
                                    '""'
                                )}"`
                        )
                        .join(";")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "reporte_prestamoflow.csv";


    link.click();


    URL.revokeObjectURL(
        url
    );


    showMessage(
        "Reporte exportado"
    );

}


/* =====================================================
   NAVEGACIÓN
===================================================== */

function scrollToId(id) {

    document
        .getElementById(id)
        .scrollIntoView({
            behavior: "smooth"
        });

}


function focusSearch() {

    scrollToId(
        "inicio"
    );


    setTimeout(
        () =>
            $("globalSearch").focus(),
        400
    );

}


function toggleMenu() {

    $("navMenu")
        .classList.toggle(
            "open"
        );

}


function applyTheme(theme) {

    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    const button = $("themeToggle");

    if (!button) return;

    button.querySelector("span").textContent =
        isDark ? "☀" : "☾";

    button.setAttribute(
        "aria-label",
        isDark ? "Activar modo claro" : "Activar modo oscuro"
    );

    button.setAttribute(
        "title",
        isDark ? "Activar modo claro" : "Activar modo oscuro"
    );

}


function toggleTheme() {

    const nextTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";

    localStorage.setItem("prestamosudc-theme", nextTheme);
    applyTheme(nextTheme);

}


/* =====================================================
   MODALES
===================================================== */

function openModal(id) {

    $(id)
        .classList.add(
            "show"
        );

}


function closeModal(id) {

    $(id)
        .classList.remove(
            "show"
        );

}


document
    .querySelectorAll(".modal")
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );


/* =====================================================
   MENSAJES
===================================================== */

function showMessage(message) {

    const toast =
        $("toast");


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),

            2500
        );

}


/* =====================================================
   ESC PARA CERRAR MODALES
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal.show"
                )
                .forEach(
                    modal =>
                        modal.classList.remove(
                            "show"
                        )
                );

        }

    }
);


/* =====================================================
   INICIALIZAR
===================================================== */

applyTheme(
    localStorage.getItem("prestamosudc-theme") || "light"
);

loadData();

setInterval(async () => {
    try {
        await loadData();
    }
    catch (error) {
        console.error("Error actualizando datos", error);
    }
}, 5000);

/* =========================================================
   CONTROLES — APP.JS
   VERSÃO WEB
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://sbiqhbxtrjrzpawdqqmy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_IJbB2nttwg70Ah1KG77Q9A_5HdR25f8";


let supabaseClient = null;


/* =========================================================
   ESTADO GLOBAL
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let transactions = [];
let receivables = [];
let goals = [];
let budgets = [];
let customCategories = [];

let subscription = null;

let financeChart = null;
let categoryChart = null;

let selectedTransactionType = "expense";
let editingTransactionId = null;

let toastTimer = null;


/* =========================================================
   CATEGORIAS PADRÃO
   ========================================================= */

const DEFAULT_CATEGORIES = [
    "Alimentação",
    "Moradia",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Compras",
    "Contas",
    "Salário",
    "Investimentos",
    "Outros"
];


/* =========================================================
   TÍTULOS
   ========================================================= */

const SECTION_TITLES = {

    dashboard: "Dashboard",

    transactions: "Lançamentos",

    receivable: "A Receber",

    categories: "Categorias",

    reports: "Relatórios",

    premium: "Premium"

};


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}


function valueOf(id) {

    const element = $(id);

    return element
        ? element.value
        : "";

}


function formatCurrency(value) {

    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function formatDateBR(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        String(dateString)
            .split("T")[0];

    const parts =
        date.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );

}


function normalizeTransactionType(type) {

    const value =
        String(type || "")
            .toLowerCase();

    if (
        value === "income" ||
        value === "receita"
    ) {

        return "income";

    }

    return "expense";

}


function getTransactionAmount(transaction) {

    return Number(
        transaction.amount ??
        transaction.valor ??
        0
    );

}


function getTransactionDescription(transaction) {

    return (
        transaction.description ||
        transaction.descricao ||
        "Sem descrição"
    );

}


function getTransactionCategory(transaction) {

    return (
        transaction.category ||
        transaction.categoria ||
        "Outros"
    );

}


function getTransactionDate(transaction) {

    return (
        transaction.transaction_date ||
        transaction.date ||
        transaction.data ||
        transaction.created_at ||
        ""
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast = $("toast");

    if (!toast) {
        return;
    }

    clearTimeout(
        toastTimer
    );

    toast.textContent =
        message;

    toast.className =
        "toast show " + type;

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   MENSAGEM DE FORMULÁRIO
   ========================================================= */

function setFormMessage(
    id,
    message,
    type = ""
) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "form-message";

    if (type) {

        element.classList.add(
            type
        );

    }

}


/* =========================================================
   INICIALIZAR SUPABASE
   ========================================================= */

function initializeSupabase() {

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "Biblioteca do Supabase não carregada."
        );

        return false;

    }

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    return true;

}


/* =========================================================
   TELAS DE AUTENTICAÇÃO
   ========================================================= */

function showLogin() {

    $("loginView")
        ?.classList.remove(
            "hidden"
        );

    $("registerView")
        ?.classList.add(
            "hidden"
        );

    $("appView")
        ?.classList.add(
            "hidden"
        );

}


function showRegister() {

    $("loginView")
        ?.classList.add(
            "hidden"
        );

    $("registerView")
        ?.classList.remove(
            "hidden"
        );

    $("appView")
        ?.classList.add(
            "hidden"
        );

}


function showApp() {

    $("loginView")
        ?.classList.add(
            "hidden"
        );

    $("registerView")
        ?.classList.add(
            "hidden"
        );

    $("appView")
        ?.classList.remove(
            "hidden"
        );

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    if (!supabaseClient) {
        return;
    }

    const email =
        valueOf(
            "loginEmail"
        ).trim();

    const password =
        valueOf(
            "loginPassword"
        );


    if (
        !email ||
        !password
    ) {

        setFormMessage(
            "loginMessage",
            "Preencha seu e-mail e sua senha.",
            "error"
        );

        return;

    }


    setFormMessage(
        "loginMessage",
        "Entrando..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error) {

            throw error;

        }


        currentUser =
            data.user;


        setFormMessage(
            "loginMessage",
            ""
        );


        await enterApp();


    } catch (error) {

        console.error(
            error
        );

        setFormMessage(
            "loginMessage",
            "E-mail ou senha incorretos.",
            "error"
        );

    }

}


/* =========================================================
   CADASTRO
   ========================================================= */

async function handleRegister(event) {

    event.preventDefault();

    if (!supabaseClient) {
        return;
    }


    const name =
        valueOf(
            "registerName"
        ).trim();

    const email =
        valueOf(
            "registerEmail"
        ).trim();

    const password =
        valueOf(
            "registerPassword"
        );


    if (
        !name ||
        !email ||
        !password
    ) {

        setFormMessage(
            "registerMessage",
            "Preencha todos os campos.",
            "error"
        );

        return;

    }


    if (
        password.length < 6
    ) {

        setFormMessage(
            "registerMessage",
            "A senha deve ter pelo menos 6 caracteres.",
            "error"
        );

        return;

    }


    setFormMessage(
        "registerMessage",
        "Criando sua conta..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signUp({

                    email,

                    password,

                    options: {

                        data: {
                            name
                        }

                    }

                });


        if (error) {

            throw error;

        }


        currentUser =
            data.user;


        setFormMessage(
            "registerMessage",
            "Conta criada com sucesso.",
            "success"
        );


        if (currentUser) {

            await createOrUpdateProfile(
                name
            );

        }


        if (data.session) {

            await enterApp();

        } else {

            showToast(
                "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
                "success"
            );

            showLogin();

        }


    } catch (error) {

        console.error(
            error
        );

        setFormMessage(
            "registerMessage",
            error.message ||
            "Não foi possível criar sua conta.",
            "error"
        );

    }

}


/* =========================================================
   PERFIL
   ========================================================= */

async function createOrUpdateProfile(name) {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        await supabaseClient
            .from("profiles")
            .upsert({

                id:
                    currentUser.id,

                name:
                    name,

                email:
                    currentUser.email

            });

    } catch (error) {

        console.warn(
            "Erro ao salvar perfil:",
            error
        );

    }

}


async function loadProfile() {

    currentProfile = null;


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("profiles")

                .select("*")

                .eq(
                    "id",
                    currentUser.id
                )

                .maybeSingle();


        if (error) {

            console.warn(
                error
            );

        }


        currentProfile =
            data || {

                name:
                    currentUser
                        .user_metadata
                        ?.name ||
                    currentUser.email
                        ?.split("@")[0] ||
                    "Usuário"

            };


        renderUser();

    } catch (error) {

        console.warn(
            "Erro ao carregar perfil:",
            error
        );

    }

}


function renderUser() {

    const name =

        currentProfile?.name ||

        currentUser?.user_metadata?.name ||

        currentUser?.email
            ?.split("@")[0] ||

        "Usuário";


    const elements = [

        $("userName"),

        $("profileName"),

        $("dashboardUserName")

    ];


    elements.forEach(
        element => {

            if (element) {

                element.textContent =
                    name;

            }

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    if (!supabaseClient) {
        return;
    }


    try {

        await supabaseClient
            .auth
            .signOut();

    } catch (error) {

        console.error(
            error
        );

    }


    currentUser = null;

    currentProfile = null;

    transactions = [];

    receivables = [];

    showLogin();

}


/* =========================================================
   ENTRAR NO APP
   ========================================================= */

async function enterApp() {

    if (!currentUser) {
        return;
    }


    showApp();


    await Promise.all([

        loadProfile(),

        loadTransactions(),

        loadReceivables(),

        loadCategories(),

        loadGoals()

    ]);


    renderAll();

    showSection(
        "dashboard"
    );

}


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showSection(section) {

    const sections =
        document.querySelectorAll(
            ".content-section"
        );


    sections.forEach(
        element => {

            element.classList.remove(
                "active"
            );

            element.classList.add(
                "hidden"
            );

        }
    );


    const target =
        $(
            section +
            "Section"
        );


    if (target) {

        target.classList.remove(
            "hidden"
        );

        target.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".nav-item[data-section]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    section
                );

            }
        );


    const title =
        $("sectionTitle");


    if (title) {

        title.textContent =
            SECTION_TITLES[section] ||
            "ControleS";

    }


    closeMobileMenu();

}


/* =========================================================
   MENU MOBILE
   ========================================================= */

function openMobileMenu() {

    $("sidebar")
        ?.classList.add(
            "open"
        );

    $("mobileOverlay")
        ?.classList.remove(
            "hidden"
        );

}


function closeMobileMenu() {

    $("sidebar")
        ?.classList.remove(
            "open"
        );

    $("mobileOverlay")
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   TRANSAÇÕES
   ========================================================= */

async function loadTransactions() {

    transactions = [];


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("transactions")

                .select("*")

                .eq(
                    "user_id",
                    currentUser.id
                )

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        transactions =
            data || [];


    } catch (error) {

        console.error(
            "Erro ao carregar lançamentos:",
            error
        );

        transactions = [];

    }

}


/* =========================================================
   TOTAL DAS TRANSAÇÕES
   ========================================================= */

function calculateTotals() {

    let income = 0;

    let expense = 0;


    transactions.forEach(
        transaction => {

            const amount =
                getTransactionAmount(
                    transaction
                );


            const type =
                normalizeTransactionType(

                    transaction.type ||
                    transaction.tipo

                );


            if (
                type ===
                "income"
            ) {

                income +=
                    amount;

            } else {

                expense +=
                    amount;

            }

        }
    );


    return {

        income,

        expense,

        balance:
            income -
            expense

    };

}


/* =========================================================
   RENDERIZAR RESUMO
   ========================================================= */

function renderSummary() {

    const totals =
        calculateTotals();


    const income =
        $("totalIncome");

    const expense =
        $("totalExpense");

    const balance =
        $("totalBalance");


    if (income) {

        income.textContent =
            formatCurrency(
                totals.income
            );

    }


    if (expense) {

        expense.textContent =
            formatCurrency(
                totals.expense
            );

    }


    if (balance) {

        balance.textContent =
            formatCurrency(
                totals.balance
            );

    }


    const savings =
        $("monthlySavings");


    if (savings) {

        savings.textContent =
            formatCurrency(
                totals.balance
            );

    }

}


/* =========================================================
   ÚLTIMOS LANÇAMENTOS
   ========================================================= */

function renderRecentTransactions() {

    const container =
        $("recentTransactions");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const recent =
        transactions
            .slice(0, 5);


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum lançamento ainda.
            </div>
        `;

        return;

    }


    recent.forEach(
        transaction => {

            const type =
                normalizeTransactionType(

                    transaction.type ||
                    transaction.tipo

                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "transaction-item";


            item.innerHTML = `

                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(
                            getTransactionDescription(
                                transaction
                            )
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            getTransactionCategory(
                                transaction
                            )
                        )}
                        •
                        ${formatDateBR(
                            getTransactionDate(
                                transaction
                            )
                        )}
                    </span>

                </div>

                <strong class="${
                    type === "income"
                        ? "income"
                        : "expense"
                }">

                    ${
                        type === "income"
                            ? "+"
                            : "-"
                    }

                    ${formatCurrency(
                        getTransactionAmount(
                            transaction
                        )
                    )}

                </strong>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


/* =========================================================
   LISTA COMPLETA
   ========================================================= */

function renderTransactions() {

    const container =
        $("transactionsList");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                Você ainda não possui lançamentos.
            </div>
        `;

        return;

    }


    transactions.forEach(
        transaction => {

            const type =
                normalizeTransactionType(

                    transaction.type ||
                    transaction.tipo

                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "transaction-row";


            item.innerHTML = `

                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(
                            getTransactionDescription(
                                transaction
                            )
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            getTransactionCategory(
                                transaction
                            )
                        )}
                        •
                        ${formatDateBR(
                            getTransactionDate(
                                transaction
                            )
                        )}
                    </span>

                </div>


                <div class="transaction-actions">

                    <strong class="${
                        type === "income"
                            ? "income"
                            : "expense"
                    }">

                        ${
                            type === "income"
                                ? "+"
                                : "-"
                        }

                        ${formatCurrency(
                            getTransactionAmount(
                                transaction
                            )
                        )}

                    </strong>


                    <button
                        type="button"
                        data-delete-transaction="${transaction.id}"
                        class="icon-button danger"
                    >
                        Excluir
                    </button>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   MODAL DE LANÇAMENTO
   ========================================================= */

function openTransactionModal(
    type = "expense"
) {

    selectedTransactionType =
        normalizeTransactionType(
            type
        );


    editingTransactionId =
        null;


    const modal =
        $("transactionModal");


    if (!modal) {
        return;
    }


    $("transactionForm")
        ?.reset();


    const dateInput =
        $("transactionDate");


    if (dateInput) {

        dateInput.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }


    updateTransactionTypeButtons();


    modal.classList.remove(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   TIPO DE LANÇAMENTO
   ========================================================= */

function updateTransactionTypeButtons() {

    document
        .querySelectorAll(
            "[data-transaction-type]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset
                        .transactionType ===
                        selectedTransactionType
                );

            }
        );

}


/* =========================================================
   FECHAR MODAIS
   ========================================================= */

function closeModals() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.classList.add(
                    "hidden"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

}


/* =========================================================
   SALVAR TRANSAÇÃO
   ========================================================= */

async function saveTransaction(event) {

    event.preventDefault();


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    const description =
        valueOf(
            "transactionDescription"
        ).trim();


    const amount =
        Number(
            valueOf(
                "transactionAmount"
            )
        );


    const date =
        valueOf(
            "transactionDate"
        );


    const category =
        valueOf(
            "transactionCategory"
        );


    const notes =
        valueOf(
            "transactionNotes"
        ).trim();


    if (
        !description ||
        !amount ||
        amount <= 0 ||
        !date
    ) {

        setFormMessage(
            "transactionMessage",
            "Preencha os campos obrigatórios.",
            "error"
        );

        return;

    }


    const payload = {

        user_id:
            currentUser.id,

        description,

        amount,

        type:
            selectedTransactionType,

        transaction_date:
            date,

        category:
            category || "Outros",

        notes

    };


    try {

        let response;


        if (editingTransactionId) {

            response =
                await supabaseClient

                    .from(
                        "transactions"
                    )

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        editingTransactionId
                    )

                    .eq(
                        "user_id",
                        currentUser.id
                    );

        } else {

            response =
                await supabaseClient

                    .from(
                        "transactions"
                    )

                    .insert(
                        payload
                    );

        }


        if (response.error) {

            throw response.error;

        }


        closeModals();


        await loadTransactions();


        renderAll();


        showToast(
            selectedTransactionType ===
            "income"

                ? "Receita adicionada com sucesso."

                : "Despesa adicionada com sucesso.",

            "success"
        );


    } catch (error) {

        console.error(
            error
        );


        setFormMessage(
            "transactionMessage",
            "Não foi possível salvar o lançamento.",
            "error"
        );

    }

}


/* =========================================================
   EXCLUIR TRANSAÇÃO
   ========================================================= */

async function deleteTransaction(id) {

    if (
        !id ||
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Deseja excluir este lançamento?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient

                .from(
                    "transactions"
                )

                .delete()

                .eq(
                    "id",
                    id
                )

                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            throw error;

        }


        await loadTransactions();


        renderAll();


        showToast(
            "Lançamento excluído.",
            "success"
        );


    } catch (error) {

        console.error(
            error
        );


        showToast(
            "Não foi possível excluir.",
            "error"
        );

    }

}


/* =========================================================
   A RECEBER
   ========================================================= */

async function loadReceivables() {

    receivables = [];


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "receivables"
                )

                .select("*")

                .eq(
                    "user_id",
                    currentUser.id
                )

                .order(
                    "due_date",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.warn(
                "Tabela receivables:",
                error.message
            );

            return;

        }


        receivables =
            data || [];


    } catch (error) {

        console.warn(
            error
        );

    }

}


/* =========================================================
   RENDER A RECEBER
   ========================================================= */

function renderReceivables() {

    const container =
        $("receivablesList");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!receivables.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum valor a receber.
            </div>
        `;

        return;

    }


    receivables.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "transaction-row";


            row.innerHTML = `

                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(
                            item.description ||
                            "Recebimento"
                        )}
                    </strong>

                    <span>
                        Receber em
                        ${formatDateBR(
                            item.due_date ||
                            item.receivable_date
                        )}
                    </span>

                </div>

                <strong class="income">

                    ${formatCurrency(
                        item.amount
                    )}

                </strong>

            `;


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   CATEGORIAS
   ========================================================= */

async function loadCategories() {

    customCategories = [];


    if (
        !supabaseClient ||
        !currentUser
    ) {

        renderCategoryOptions();

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "categories"
                )

                .select("*")

                .eq(
                    "user_id",
                    currentUser.id
                );


        if (!error) {

            customCategories =
                data || [];

        }


    } catch (error) {

        console.warn(
            error
        );

    }


    renderCategoryOptions();

}


/* =========================================================
   TODAS AS CATEGORIAS
   ========================================================= */

function getAllCategories() {

    const custom =
        customCategories
            .map(
                item =>
                    item.name ||
                    item.category ||
                    item.nome
            )
            .filter(Boolean);


    return [
        ...new Set([
            ...DEFAULT_CATEGORIES,
            ...custom
        ])
    ];

}


/* =========================================================
   OPTIONS DAS CATEGORIAS
   ========================================================= */

function renderCategoryOptions() {

    const categories =
        getAllCategories();


    [
        $("transactionCategory"),
        $("receivableCategory")
    ]
        .filter(Boolean)
        .forEach(
            select => {

                const previous =
                    select.value;


                select.innerHTML =
                    "";


                categories.forEach(
                    category => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            category;

                        option.textContent =
                            category;


                        select.appendChild(
                            option
                        );

                    }
                );


                if (
                    categories.includes(
                        previous
                    )
                ) {

                    select.value =
                        previous;

                }

            }
        );


    renderCategories();

}


/* =========================================================
   RENDER CATEGORIAS
   ========================================================= */

function renderCategories() {

    const container =
        $("categoriesList");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    getAllCategories()
        .forEach(
            category => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "category-item";


                item.textContent =
                    category;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   METAS
   ========================================================= */

async function loadGoals() {

    goals = [];


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "goals"
                )

                .select("*")

                .eq(
                    "user_id",
                    currentUser.id
                );


        if (!error) {

            goals =
                data || [];

        }


    } catch (error) {

        console.warn(
            error
        );

    }

}


/* =========================================================
   GRÁFICO FINANCEIRO
   ========================================================= */

function renderFinanceChart() {

    const canvas =
        $("financeChart");


    if (
        !canvas ||
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    const totals =
        calculateTotals();


    if (financeChart) {

        financeChart.destroy();

    }


    financeChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels: [
                        "Receitas",
                        "Despesas"
                    ],

                    datasets: [
                        {

                            label:
                                "Valor",

                            data: [
                                totals.income,
                                totals.expense
                            ]

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


/* =========================================================
   GRÁFICO POR CATEGORIA
   ========================================================= */

function renderCategoryChart() {

    const canvas =
        $("categoryChart");


    if (
        !canvas ||
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    const values = {};


    transactions
        .filter(
            transaction =>
                normalizeTransactionType(
                    transaction.type ||
                    transaction.tipo
                ) ===
                "expense"
        )
        .forEach(
            transaction => {

                const category =
                    getTransactionCategory(
                        transaction
                    );


                values[category] =
                    (
                        values[category] ||
                        0
                    ) +
                    getTransactionAmount(
                        transaction
                    );

            }
        );


    if (categoryChart) {

        categoryChart.destroy();

    }


    categoryChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels:
                        Object.keys(
                            values
                        ),

                    datasets: [
                        {

                            data:
                                Object.values(
                                    values
                                )

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }
        );

}


/* =========================================================
   ANÁLISE AUTOMÁTICA
   ========================================================= */

function renderAutomaticAnalysis() {

    const element =
        $("automaticReportAnalysis");


    if (!element) {
        return;
    }


    const totals =
        calculateTotals();


    let message;


    if (
        !transactions.length
    ) {

        message =
            "Adicione lançamentos para gerar sua análise financeira.";

    } else if (
        totals.expense >
        totals.income
    ) {

        message =
            "Suas despesas estão maiores que suas receitas. Vale a pena revisar os principais gastos.";

    } else if (
        totals.expense >
        totals.income * 0.8
    ) {

        message =
            "Seu saldo está positivo, mas grande parte da sua renda já está comprometida com despesas.";

    } else {

        message =
            "Sua situação financeira está positiva. Continue acompanhando seus gastos e mantendo uma reserva.";

    }


    element.textContent =
        message;

}


/* =========================================================
   PREMIUM WEB
   ========================================================= */

function isPremiumActive() {

    if (!subscription) {
        return false;
    }


    if (
        subscription.status !==
        "active"
    ) {

        return false;

    }


    if (
        subscription.expires_at
    ) {

        return (
            new Date(
                subscription.expires_at
            ) >
            new Date()
        );

    }


    return true;

}


/* =========================================================
   CARREGAR PREMIUM DO SUPABASE
   ========================================================= */

async function loadSubscription() {

    subscription = null;


    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "subscriptions"
                )

                .select("*")

                .eq(
                    "user_id",
                    currentUser.id
                )

                .eq(
                    "status",
                    "active"
                )

                .maybeSingle();


        if (!error) {

            subscription =
                data || null;

        }


    } catch (error) {

        console.warn(
            "Assinatura:",
            error
        );

    }


    renderPremium();

}


/* =========================================================
   RENDER PREMIUM
   ========================================================= */

function renderPremium() {

    const status =
        $("premiumStatusText");


    if (status) {

        status.textContent =
            isPremiumActive()

                ? "Premium ativo"

                : "Plano gratuito";

    }


    document.body.classList.toggle(
        "premium-plan",
        isPremiumActive()
    );


    document.body.classList.toggle(
        "free-plan",
        !isPremiumActive()
    );

}


/* =========================================================
   EXPORTAR CSV
   ========================================================= */

function exportTransactionsCSV() {

    if (
        !transactions.length
    ) {

        showToast(
            "Não existem lançamentos para exportar.",
            "warning"
        );

        return;

    }


    const rows = [

        [
            "Data",
            "Descrição",
            "Categoria",
            "Tipo",
            "Valor"
        ]

    ];


    transactions.forEach(
        transaction => {

            const type =
                normalizeTransactionType(

                    transaction.type ||
                    transaction.tipo

                );


            rows.push([

                getTransactionDate(
                    transaction
                ),

                getTransactionDescription(
                    transaction
                ),

                getTransactionCategory(
                    transaction
                ),

                type === "income"
                    ? "Receita"
                    : "Despesa",

                getTransactionAmount(
                    transaction
                )

            ]);

        }
    );


    const csv =
        rows

            .map(
                row =>

                    row

                        .map(
                            value =>

                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`

                        )

                        .join(";")

            )

            .join("\n");


    const blob =
        new Blob(
            [
                "\ufeff" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
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
        "controles-lancamentos.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   TEMA
   ========================================================= */

function toggleTheme() {

    const dark =
        document.body
            .classList
            .toggle(
                "dark-theme"
            );


    localStorage.setItem(
        "controles-theme",
        dark
            ? "dark"
            : "light"
    );


    const button =
        $("themeBtn");


    if (button) {

        button.setAttribute(
            "aria-pressed",
            dark
                ? "true"
                : "false"
        );

    }

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "controles-theme"
        );


    if (
        theme ===
        "dark"
    ) {

        document.body
            .classList
            .add(
                "dark-theme"
            );

    }

}


/* =========================================================
   RENDERIZAR TUDO
   ========================================================= */

function renderAll() {

    renderUser();

    renderSummary();

    renderRecentTransactions();

    renderTransactions();

    renderReceivables();

    renderCategories();

    renderFinanceChart();

    renderCategoryChart();

    renderAutomaticAnalysis();

    renderPremium();

}


/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function togglePassword(button) {

    const targetId =
        button.dataset
            .passwordToggle;


    const input =
        $(targetId);


    if (!input) {
        return;
    }


    const showing =
        input.type ===
        "text";


    input.type =
        showing
            ? "password"
            : "text";


    button.setAttribute(
        "aria-pressed",
        showing
            ? "false"
            : "true"
    );

}


/* =========================================================
   EVENTOS
   ========================================================= */

function bindEvents() {

    $("loginForm")
        ?.addEventListener(
            "submit",
            handleLogin
        );


    $("registerForm")
        ?.addEventListener(
            "submit",
            handleRegister
        );


    $("transactionForm")
        ?.addEventListener(
            "submit",
            saveTransaction
        );


    $("registerBtn")
        ?.addEventListener(
            "click",
            showRegister
        );


    $("backToLoginBtn")
        ?.addEventListener(
            "click",
            showLogin
        );


    $("loginBtn")
        ?.addEventListener(
            "click",
            showLogin
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    $("themeBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            openMobileMenu
        );


    $("mobileOverlay")
        ?.addEventListener(
            "click",
            closeMobileMenu
        );


    /* =====================================================
       NAVEGAÇÃO
       ===================================================== */

    document
        .querySelectorAll(
            ".nav-item[data-section]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showSection(
                            button.dataset
                                .section
                        );

                    }
                );

            }
        );


    /* =====================================================
       MOSTRAR SENHA
       ===================================================== */

    document
        .querySelectorAll(
            "[data-password-toggle]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        togglePassword(
                            button
                        );

                    }
                );

            }
        );


    /* =====================================================
       FECHAR MODAIS
       ===================================================== */

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeModals
                );

            }
        );


    /* =====================================================
       TIPO DA TRANSAÇÃO
       ===================================================== */

    document
        .querySelectorAll(
            "[data-transaction-type]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectedTransactionType =
                            normalizeTransactionType(
                                button.dataset
                                    .transactionType
                            );


                        updateTransactionTypeButtons();

                    }
                );

            }
        );


    /* =====================================================
       BOTÕES RECEITA
       ===================================================== */

    [
        "addIncomeBtn",
        "quickIncomeBtn"
    ]
        .forEach(
            id => {

                $(id)
                    ?.addEventListener(
                        "click",
                        () =>
                            openTransactionModal(
                                "income"
                            )
                    );

            }
        );


    /* =====================================================
       BOTÕES DESPESA
       ===================================================== */

    [
        "addExpenseBtn",
        "quickExpenseBtn"
    ]
        .forEach(
            id => {

                $(id)
                    ?.addEventListener(
                        "click",
                        () =>
                            openTransactionModal(
                                "expense"
                            )
                    );

            }
        );


    /* =====================================================
       BOTÃO GENÉRICO
       ===================================================== */

    [
        "addTransactionBtn",
        "addTransactionBtn2"
    ]
        .forEach(
            id => {

                $(id)
                    ?.addEventListener(
                        "click",
                        () =>
                            openTransactionModal(
                                "expense"
                            )
                    );

            }
        );


    /* =====================================================
       EVENTOS GERAIS
       ===================================================== */

    document.addEventListener(
        "click",
        async event => {

            const deleteButton =
                event.target.closest(
                    "[data-delete-transaction]"
                );


            if (deleteButton) {

                await deleteTransaction(
                    deleteButton.dataset
                        .deleteTransaction
                );

                return;

            }


            const exportButton =
                event.target.closest(
                    "#exportTransactionsBtn, [data-export-transactions]"
                );


            if (exportButton) {

                event.preventDefault();

                exportTransactionsCSV();

            }

        }
    );

}


/* =========================================================
   VERIFICAR SESSÃO
   ========================================================= */

async function initializeAuth() {

    if (!supabaseClient) {

        showLogin();

        return;

    }


    try {

        const {
            data
        } =
            await supabaseClient
                .auth
                .getSession();


        const session =
            data?.session;


        if (
            session?.user
        ) {

            currentUser =
                session.user;


            await enterApp();


            await loadSubscription();


        } else {

            showLogin();

        }


        supabaseClient
            .auth
            .onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        currentUser =
                            null;

                        showLogin();

                        return;

                    }


                    if (
                        session?.user
                    ) {

                        currentUser =
                            session.user;

                    }

                }
            );


    } catch (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

        showLogin();

    }

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loadTheme();

        bindEvents();


        const initialized =
            initializeSupabase();


        if (!initialized) {

            showLogin();

            showToast(
                "Não foi possível iniciar o ControleS.",
                "error"
            );

            return;

        }


        await initializeAuth();

    }
);

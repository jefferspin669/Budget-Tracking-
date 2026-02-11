# Budget-Tracking-
A responsive budgeting application that allows users to track income and expenses, filter transactions by category and month, visualize financial data with Chart.js, and export data as CSV. Built using vanilla JavaScript with LocalStorage for persistent data management and dark mode support.
const form = document.getElementById('transaction-form');
const list = document.getElementById('transaction-list');
const totalEl = document.getElementById('total');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');

const categoryFilter = document.getElementById('category-filter');
const monthPicker = document.getElementById('month-picker');
const chartToggle = document.getElementById('chart-toggle');
const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-csv');

const desc = document.getElementById('desc');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const dateInput = document.getElementById('date');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chartType = 'line';
let chart, pieChart;

const save = () =>
    localStorage.setItem('transactions', JSON.stringify(transactions));

const filtered = () =>
    transactions.filter(t =>
        (!monthPicker.value || t.date.startsWith(monthPicker.value)) &&
        (categoryFilter.value === 'all' || t.category === categoryFilter.value)
    );

// Add transaction
form.addEventListener('submit', e => {
    e.preventDefault();

    transactions.push({
        id: Date.now(),
        description: desc.value,
        amount: +amount.value,
        type: type.value,
        category: category.value,
        date: dateInput.value
    });

    save();
    form.reset();
    dateInput.valueAsDate = new Date();
    render();
});

// Delete
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    save();
    render();
}

// List
function renderList() {
    list.innerHTML = '';
    filtered().forEach(t => {
        const li = document.createElement('li');
        li.className = t.type;
        li.innerHTML = `
            <span>${t.description} (${t.category})</span>
            <span>
                ${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}
                <button class="delete-btn">X</button>
            </span>
        `;
        li.querySelector('button').onclick = () => deleteTransaction(t.id);
        list.appendChild(li);
    });
}

// Balance
function renderBalance() {
    let income = 0, expense = 0;
    filtered().forEach(t =>
        t.type === 'income' ? income += t.amount : expense += t.amount
    );

    incomeEl.textContent = `$${income.toFixed(2)}`;
    expenseEl.textContent = `$${expense.toFixed(2)}`;
    totalEl.textContent = `$${(income - expense).toFixed(2)}`;
}

// Categories
function renderCategories() {
    const cats = [...new Set(transactions.map(t => t.category))];
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        categoryFilter.appendChild(o);
    });
}

// Monthly chart
function renderChart() {
    const data = {};
    filtered().forEach(t => {
        const m = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!data[m]) data[m] = { income: 0, expense: 0 };
        data[m][t.type] += t.amount;
    });

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: chartType,
        data: {
            labels: Object.keys(data),
            datasets: [
                { label: 'Income', data: Object.values(data).map(d => d.income), backgroundColor: '#27ae60' },
                { label: 'Expense', data: Object.values(data).map(d => d.expense), backgroundColor: '#c0392b' }
            ]
        }
    });
}

// Pie chart
function renderPie() {
    const data = {};
    filtered().forEach(t => data[t.category] = (data[t.category] || 0) + t.amount);

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pie-chart'), {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: Object.keys(data).map((_, i) => `hsl(${i * 60},70%,60%)`)
            }]
        }
    });
}

// CSV
exportBtn.onclick = () => {
    if (!transactions.length) return;
    const rows = [['Date','Desc','Cat','Type','Amount'],
        ...transactions.map(t => [t.date,t.description,t.category,t.type,t.amount])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'budget.csv';
    a.click();
};

// Controls
chartToggle.onclick = () => {
    chartType = chartType === 'line' ? 'bar' : 'line';
    chartToggle.textContent = chartType === 'line' ? 'Switch to Bar' : 'Switch to Line';
    renderChart();
};

themeToggle.onclick = () => document.body.classList.toggle('dark');
categoryFilter.onchange = render;
monthPicker.onchange = render;

function render() {
    renderList();
    renderBalance();
    renderCategories();
    renderChart();
    renderPie();
}

dateInput.valueAsDate = new Date();
render();
body{
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
}
header{
    background-color: #35424a;
    color: #ffffff;
    padding: 10px 0;
    text-align: center;
}
/* Base */
body {
    font-family: 'Segoe UI', sans-serif;
    background: #f4f4f4;
    margin: 0;
    color: #333;
}

header {
    background: #2c3e50;
    color: white;
    padding: 20px;
    text-align: center;
    position: relative;
}

.header-buttons {
    position: absolute;
    right: 20px;
    top: 20px;
}

main {
    max-width: 700px;
    margin: 30px auto;
    padding: 0 15px;
}

section {
    background: white;
    padding: 20px;
    margin-bottom: 25px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,.05);
}

section h2 { margin-top: 0; }

/* Form */
form input, form select, form button {
    padding: 10px;
    margin: 5px 5px 10px 0;
    border-radius: 6px;
    border: 1px solid #ccc;
}

form button {
    background-color: #2c3e50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
}

form button:hover {
    background-color: #34495e;
    transform: translateY(-2px);
}

/* Filters */
.filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

button#export-csv {
    background-color: #2980b9;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
}
button#export-csv:hover { background-color: #3498db; transform: translateY(-2px); }

button#chart-toggle {
    background-color: #16a085;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 10px;
}
button#chart-toggle:hover { background-color: #1abc9c; transform: translateY(-2px); }

/* List */
ul { list-style: none; padding: 0; }
li {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 6px;
    background: #f9f9f9;
}
li.income { border-left: 5px solid #27ae60; }
li.expense { border-left: 5px solid #c0392b; }
.delete-btn {
    background: #c0392b;
    color: white;
    border: none;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
}

/* Chart */
canvas { width: 100% !important; height: 300px !important; display: block; margin: auto; }

/* Dark Mode */
.dark { background: #121212; color: #e0e0e0; }
.dark section { background: #1e1e1e; }
.dark li { background: #2a2a2a; }
.dark form button { background-color: #444; }
.dark form button:hover { background-color: #555; }
.dark button#export-csv { background-color: #1f618d; }
.dark button#export-csv:hover { background-color: #2874a6; }
.dark button#chart-toggle { background-color: #117a65; }
.dark button#chart-toggle:hover { background-color: #138d75; }

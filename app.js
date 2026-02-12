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

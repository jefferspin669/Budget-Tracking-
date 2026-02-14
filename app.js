let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;

let breakdownChart;
let savingsChart;

const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const darkToggle = document.getElementById("darkToggle");

saveBtn.addEventListener("click", addTransaction);
exportBtn.addEventListener("click", exportCSV);
darkToggle.addEventListener("click", toggleDarkMode);

if (darkMode) document.body.classList.add("dark");

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",
    document.body.classList.contains("dark"));
}

function save() {
  localStorage.setItem("transactions",
    JSON.stringify(transactions));
}

function addTransaction() {
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;
  const recurring = document.getElementById("recurring").value;
  const recurringEnd = document.getElementById("recurringEnd").value;

  if (!description || isNaN(amount) || !date) {
    alert("Please fill all required fields correctly.");
    return;
  }

  transactions.push({
    id: Date.now(),
    description,
    amount,
    type,
    date,
    recurring,
    recurringEnd: recurringEnd || null,
    active: true,
    parentId: null
  });

  save();
  render();
}

function render() {
  generateRecurring();
  renderTransactions();
  renderBalance();
  renderProjected();
  renderCharts();
  renderInsights();
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  list.innerHTML = "";

  transactions.forEach(t => {
    const div = document.createElement("div");
    div.className = "transaction";

    div.innerHTML = `
      <span class="${t.type}">
        ${t.description} - $${t.amount.toFixed(2)} (${t.date})
      </span>
      <span>
        <button onclick="deleteTransaction(${t.id})">Delete</button>
        ${t.recurring !== "none" && !t.parentId && t.active
          ? `<button onclick="stopRecurring(${t.id})">Stop</button>`
          : ""}
      </span>
    `;

    list.appendChild(div);
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
}

function stopRecurring(id) {
  const t = transactions.find(x => x.id === id);
  if (t) t.active = false;
  save();
  render();
}

function renderBalance() {
  const total = transactions.reduce((sum, t) =>
    t.type === "income" ? sum + t.amount : sum - t.amount
  , 0);

  document.getElementById("balance").innerText =
    total.toFixed(2);
}

function renderProjected() {
  const future = new Date();
  future.setDate(future.getDate() + 30);

  const projected = transactions.reduce((sum, t) => {
    if (new Date(t.date) <= future)
      return t.type === "income" ? sum + t.amount : sum - t.amount;
    return sum;
  }, 0);

  document.getElementById("projected").innerText =
    projected.toFixed(2);
}

function generateRecurring() {
  const today = new Date();

  transactions.forEach(original => {
    if (!original.active ||
        original.recurring === "none" ||
        original.parentId) return;

    let next = new Date(original.date);
    const end = original.recurringEnd
      ? new Date(original.recurringEnd)
      : null;

    while (next <= today) {

      if (end && next > end) break;

      const dateStr = next.toISOString().slice(0,10);

      const exists = transactions.some(t =>
        t.parentId === original.id &&
        t.date === dateStr
      );

      if (!exists && next > new Date(original.date)) {
        transactions.push({
          ...original,
          id: Date.now() + Math.random(),
          parentId: original.id,
          date: dateStr
        });
      }

      if (original.recurring === "weekly")
        next.setDate(next.getDate() + 7);
      else if (original.recurring === "biweekly")
        next.setDate(next.getDate() + 14);
      else
        next.setMonth(next.getMonth() + 1);
    }
  });

  save();
}

function renderCharts() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((s,t)=>s+t.amount,0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((s,t)=>s+t.amount,0);

  if (breakdownChart) breakdownChart.destroy();
  breakdownChart = new Chart(
    document.getElementById("breakdownChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Income","Expense"],
        datasets: [{ data: [income, expense] }]
      }
    }
  );

  const sorted = [...transactions]
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  let running = 0;
  const labels = [];
  const data = [];

  sorted.forEach(t=>{
    running += t.type==="income"?t.amount:-t.amount;
    labels.push(t.date);
    data.push(running);
  });

  if (savingsChart) savingsChart.destroy();
  savingsChart = new Chart(
    document.getElementById("savingsChart"),
    {
      type: "line",
      data: {
        labels,
        datasets: [{ label:"Balance", data }]
      }
    }
  );
}

function renderInsights() {
  const container =
    document.getElementById("insights");
  container.innerHTML = "";

  const income = transactions
    .filter(t=>t.type==="income")
    .reduce((s,t)=>s+t.amount,0);

  const expense = transactions
    .filter(t=>t.type==="expense")
    .reduce((s,t)=>s+t.amount,0);

  const text = income > expense
    ? "💰 You're saving money overall."
    : "⚠️ You're spending more than you earn.";

  const div = document.createElement("div");
  div.className = "insight-card";
  div.innerText = text;

  container.appendChild(div);
}

function exportCSV() {
  const rows =
    [["Description","Amount","Type","Date"]];

  transactions.forEach(t=>{
    rows.push([
      t.description,
      t.amount,
      t.type,
      t.date
    ]);
  });

  const csv =
    rows.map(r=>r.join(",")).join("\n");

  const blob =
    new Blob([csv],{type:"text/csv"});

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = "transactions.csv";
  a.click();
}

render();


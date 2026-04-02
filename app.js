
let transactionsDatabase = [
    { id: 101, date: "2025-03-15", amount: 4850.75, category: "Salary", type: "income" },
    { id: 102, date: "2025-03-12", amount: 124.99, category: "Groceries", type: "expense" },
    { id: 103, date: "2025-03-08", amount: 67.30, category: "Transport", type: "expense" },
    { id: 104, date: "2025-03-05", amount: 2100.00, category: "Freelance", type: "income" },
    { id: 105, date: "2025-02-25", amount: 340.50, category: "Dining Out", type: "expense" },
    { id: 106, date: "2025-02-18", amount: 89.99, category: "Entertainment", type: "expense" },
    { id: 107, date: "2025-02-10", amount: 560.00, category: "Shopping", type: "expense" },
    { id: 108, date: "2025-02-01", amount: 4820.00, category: "Salary", type: "income" },
    { id: 109, date: "2025-01-28", amount: 215.40, category: "Utilities", type: "expense" },
    { id: 110, date: "2025-01-20", amount: 75.25, category: "Healthcare", type: "expense" },
    { id: 111, date: "2025-01-15", amount: 3100.00, category: "Bonus", type: "income" },
    { id: 112, date: "2025-03-18", amount: 45.00, category: "Coffee Shops", type: "expense" },
    { id: 113, date: "2025-02-14", amount: 230.00, category: "Gifts", type: "expense" },
    { id: 114, date: "2025-03-01", amount: 1350.00, category: "Rent", type: "expense" }
  ];
  
  // Global state management
  let appState = {
    currentRole: "admin",     // 'admin' or 'viewer'
    filters: {
      searchQuery: "",
      transactionType: "all",
      sortRule: "date-desc"
    }
  };
  
  // Chart instances
  let trendChartInstance = null;
  let categoryChartInstance = null;
  
  // Helper: compute totals
  function computeFinancialTotals() {
    let totalIncome = 0, totalExpense = 0;
    transactionsDatabase.forEach(tx => {
      if (tx.type === "income") totalIncome += tx.amount;
      else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }
  
  // Helper: get filtered & sorted transactions
  function getProcessedTransactions() {
    let filtered = [...transactionsDatabase];
    const { searchQuery, transactionType, sortRule } = appState.filters;
    
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => tx.category.toLowerCase().includes(lowerQuery));
    }
    
    if (transactionType !== "all") {
      filtered = filtered.filter(tx => tx.type === transactionType);
    }
    
    switch (sortRule) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amount-desc":
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-asc":
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      default: break;
    }
    return filtered;
  }
  
  // Insights generation (unique logic)
  function generateSmartInsights() {
    const expensesOnly = transactionsDatabase.filter(t => t.type === "expense");
    const categoryExpenseMap = new Map();
    expensesOnly.forEach(exp => {
      const current = categoryExpenseMap.get(exp.category) || 0;
      categoryExpenseMap.set(exp.category, current + exp.amount);
    });
    
    let highestCategory = "None";
    let highestAmount = 0;
    for (let [cat, amt] of categoryExpenseMap.entries()) {
      if (amt > highestAmount) {
        highestAmount = amt;
        highestCategory = cat;
      }
    }
    
    // Monthly comparison (current vs previous)
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    let currentMonthExpense = 0, previousMonthExpense = 0;
    transactionsDatabase.forEach(tx => {
      if (tx.type === "expense") {
        const txMonth = tx.date.substring(0, 7);
        if (txMonth === currentYearMonth) currentMonthExpense += tx.amount;
        if (txMonth === prevYearMonth) previousMonthExpense += tx.amount;
      }
    });
    
    let monthlyComparisonText = "Insufficient data";
    if (previousMonthExpense > 0) {
      const percentChange = ((currentMonthExpense - previousMonthExpense) / previousMonthExpense * 100).toFixed(1);
      monthlyComparisonText = `${currentYearMonth}: $${currentMonthExpense.toFixed(0)} vs ${prevYearMonth}: $${previousMonthExpense.toFixed(0)} (${percentChange}% change)`;
    } else if (currentMonthExpense > 0) {
      monthlyComparisonText = `${currentYearMonth} expenses: $${currentMonthExpense.toFixed(0)} (baseline month)`;
    }
    
    const totalSpend = expensesOnly.reduce((sum, e) => sum + e.amount, 0);
    const avgTransaction = expensesOnly.length ? (totalSpend / expensesOnly.length).toFixed(2) : 0;
    
    return { highestCategory, highestAmount, monthlyComparisonText, avgTransaction, totalSpend };
  }
  
  // Render insights to UI
  function renderInsights() {
    const insights = generateSmartInsights();
    const container = document.getElementById("insightsContainer");
    container.innerHTML = `
      <div class="insight-card">
        <i class="fas fa-trophy"></i> <strong>Highest Spending Category</strong>
        <p>${insights.highestCategory} · $${insights.highestAmount.toFixed(2)} spent</p>
      </div>
      <div class="insight-card">
        <i class="fas fa-calendar-alt"></i> <strong>Monthly Expense Trend</strong>
        <p>${insights.monthlyComparisonText}</p>
      </div>
      <div class="insight-card">
        <i class="fas fa-chart-line"></i> <strong>Spending Behaviour</strong>
        <p>Average expense: $${insights.avgTransaction} | Total spend: $${insights.totalSpend.toFixed(2)}</p>
      </div>
    `;
  }
  
  // Render transaction list with role-based actions
  function renderTransactions() {
    const transactionsList = getProcessedTransactions();
    const container = document.getElementById("transactionListContainer");
    
    if (transactionsList.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-ban"></i> No transactions match current filters</div>`;
      return;
    }
    
    container.innerHTML = transactionsList.map(tx => `
      <div class="transaction-item" data-tx-id="${tx.id}">
        <div class="tx-info">
          <span class="tx-date">${tx.date}</span>
          <span class="tx-category">${tx.category}</span>
          <span class="tx-amount ${tx.type === 'income' ? 'income-amount' : 'expense-amount'}">
            ${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}
          </span>
          <span class="tx-type-badge">${tx.type === 'income' ? '💰 Income' : '💸 Expense'}</span>
        </div>
        <div class="action-buttons" id="txActions-${tx.id}">
          ${appState.currentRole === 'admin' ? `
            <button class="btn-icon edit-transaction" data-id="${tx.id}" title="Modify transaction"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-transaction" data-id="${tx.id}" title="Remove transaction"><i class="fas fa-trash-alt"></i></button>
          ` : `<span style="font-size:12px; color:#99aec9;"><i class="fas fa-lock"></i> Viewer mode</span>`}
        </div>
      </div>
    `).join('');
    
    // Attach admin events if applicable
    if (appState.currentRole === 'admin') {
      document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(btn.getAttribute('data-id'));
          deleteTransactionById(id);
        });
      });
      document.querySelectorAll('.edit-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(btn.getAttribute('data-id'));
          promptEditTransaction(id);
        });
      });
    }
  }
  
  function deleteTransactionById(id) {
    if (appState.currentRole !== 'admin') return;
    transactionsDatabase = transactionsDatabase.filter(t => t.id !== id);
    refreshEntireDashboard();
  }
  
  function promptEditTransaction(id) {
    if (appState.currentRole !== 'admin') return;
    const targetTx = transactionsDatabase.find(t => t.id === id);
    if (!targetTx) return;
    const newAmount = prompt("Edit amount (numeric):", targetTx.amount);
    const newCategory = prompt("Edit category name:", targetTx.category);
    if (newAmount !== null && !isNaN(parseFloat(newAmount)) && parseFloat(newAmount) > 0) {
      targetTx.amount = parseFloat(newAmount);
    }
    if (newCategory !== null && newCategory.trim() !== "") {
      targetTx.category = newCategory.trim();
    }
    refreshEntireDashboard();
  }
  
  function addNewTransaction(transactionData) {
    if (appState.currentRole !== 'admin') return false;
    const newId = Math.max(...transactionsDatabase.map(t => t.id), 0) + 1;
    const newTx = { id: newId, ...transactionData };
    transactionsDatabase.push(newTx);
    refreshEntireDashboard();
    return true;
  }
  
  // Admin form rendering
  function renderAddTransactionForm() {
    const container = document.getElementById("addTransactionArea");
    if (appState.currentRole === 'admin') {
      container.innerHTML = `
        <div class="add-tx-form">
          <input type="date" id="newTxDate" value="${new Date().toISOString().slice(0,10)}">
          <input type="number" id="newTxAmount" placeholder="Amount" step="0.01">
          <input type="text" id="newTxCategory" placeholder="Category (e.g., Shopping)">
          <select id="newTxType">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button class="btn-primary" id="submitAddTxBtn">+ Create Transaction</button>
        </div>
      `;
      document.getElementById("submitAddTxBtn").addEventListener("click", () => {
        const date = document.getElementById("newTxDate").value;
        const amount = parseFloat(document.getElementById("newTxAmount").value);
        const category = document.getElementById("newTxCategory").value.trim();
        const type = document.getElementById("newTxType").value;
        if (!date || isNaN(amount) || amount <= 0 || category === "") {
          alert("Please fill all fields correctly (amount >0, category required)");
          return;
        }
        addNewTransaction({ date, amount, category, type });
        document.getElementById("newTxAmount").value = "";
        document.getElementById("newTxCategory").value = "";
      });
    } else {
      container.innerHTML = `<div class="empty-state" style="padding:12px;"><i class="fas fa-eye"></i> Viewer: Add transactions disabled</div>`;
    }
  }
  
  // Chart: Balance trend (monthly cumulative)
  function updateBalanceTrendChart() {
    const monthMap = new Map();
    transactionsDatabase.forEach(tx => {
      const monthKey = tx.date.substring(0,7);
      let delta = tx.type === 'income' ? tx.amount : -tx.amount;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + delta);
    });
    const sortedMonths = Array.from(monthMap.keys()).sort();
    let running = 0;
    const balances = [];
    for (let mon of sortedMonths) {
      running += monthMap.get(mon);
      balances.push(running);
    }
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedMonths,
        datasets: [{ label: 'Cumulative Balance ($)', data: balances, borderColor: '#2c6280', backgroundColor: 'rgba(44,98,128,0.05)', fill: true, tension: 0.3, pointBackgroundColor: '#2c6280' }]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }
  
  function updateCategoryChart() {
    const expenseMap = new Map();
    transactionsDatabase.filter(t => t.type === 'expense').forEach(tx => {
      expenseMap.set(tx.category, (expenseMap.get(tx.category) || 0) + tx.amount);
    });
    const categories = Array.from(expenseMap.keys());
    const amounts = Array.from(expenseMap.values());
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{ data: amounts, backgroundColor: ['#2c6280', '#4986a8', '#6aa3c2', '#8fbbd6', '#3f8db3', '#1f5a7a'], borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
    });
  }
  
  // Update summary cards
  function updateSummaryCards() {
    const { totalIncome, totalExpense, balance } = computeFinancialTotals();
    document.getElementById("totalBalance").innerText = `$${balance.toFixed(2)}`;
    document.getElementById("totalIncome").innerText = `$${totalIncome.toFixed(2)}`;
    document.getElementById("totalExpense").innerText = `$${totalExpense.toFixed(2)}`;
  }
  
  // Global refresh orchestrator
  function refreshEntireDashboard() {
    updateSummaryCards();
    renderTransactions();
    renderInsights();
    updateBalanceTrendChart();
    updateCategoryChart();
    renderAddTransactionForm();
    const roleBadge = document.getElementById("roleBadge");
    if (roleBadge) roleBadge.innerText = appState.currentRole === 'admin' ? 'ADMIN' : 'VIEWER';
  }
  
  // Event listeners & filter bindings
  function bindFilterEvents() {
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const sortSelect = document.getElementById("sortBy");
    
    const updateFilters = () => {
      appState.filters.searchQuery = searchInput.value;
      appState.filters.transactionType = typeFilter.value;
      appState.filters.sortRule = sortSelect.value;
      refreshEntireDashboard();
    };
    searchInput.addEventListener("input", updateFilters);
    typeFilter.addEventListener("change", updateFilters);
    sortSelect.addEventListener("change", updateFilters);
  }
  
  // Role switcher
  function initRoleSwitcher() {
    const roleSelector = document.getElementById("roleSwitcher");
    roleSelector.addEventListener("change", (e) => {
      appState.currentRole = e.target.value;
      refreshEntireDashboard();
    });
  }
  
  // Initialize everything
  document.addEventListener("DOMContentLoaded", () => {
    bindFilterEvents();
    initRoleSwitcher();
    refreshEntireDashboard();
  });
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let expenses = JSON.parse(localStorage.getItem('agriExpenses')) || [];
    let categoryChart, monthlyTrendChart;
    
    // DOM Elements
    const expenseForm = document.getElementById('expenseForm');
    const expensesTableBody = document.getElementById('expensesTableBody');
    const totalExpensesElement = document.getElementById('totalExpenses');
    const monthlyExpensesElement = document.getElementById('monthlyExpenses');
    const lastMonthExpensesElement = document.getElementById('lastMonthExpenses');
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    
    // Initialize the app
    init();
    
    function init() {
        // Load expenses
        renderExpenses();
        updateSummary();
        initCharts();
        
        // Event listeners
        expenseForm.addEventListener('submit', addExpense);
        filterMonth.addEventListener('change', renderExpenses);
        filterYear.addEventListener('change', renderExpenses);
    }
    
    // Add new expense
    function addExpense(e) {
        e.preventDefault();
        
        const expense = {
            id: Date.now(),
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value)
        };
        
        expenses.push(expense);
        saveExpenses();
        renderExpenses();
        updateSummary();
        updateCharts();
        expenseForm.reset();
    }
    
    // Render expenses table
    function renderExpenses() {
        const monthFilter = filterMonth.value;
        const yearFilter = filterYear.value;
        
        let filteredExpenses = [...expenses];
        
        if (monthFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => {
                const date = new Date(expense.date);
                return (date.getMonth() + 1) == monthFilter && date.getFullYear() == yearFilter;
            });
        } else if (yearFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => {
                const date = new Date(expense.date);
                return date.getFullYear() == yearFilter;
            });
        }
        
        expensesTableBody.innerHTML = '';
        
        if (filteredExpenses.length === 0) {
            expensesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses found</td></tr>';
            return;
        }
        
        filteredExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.className = 'expense-item';
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td><span class="badge category-badge">${expense.category}</span></td>
                <td>${expense.description}</td>
                <td>₹${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${expense.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}">Delete</button>
                </td>
            `;
            expensesTableBody.appendChild(row);
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteExpense(parseInt(btn.dataset.id)));
        });
    }
    
    // Open edit modal
    function openEditModal(id) {
        const expense = expenses.find(exp => exp.id === id);
        if (!expense) return;
        
        document.getElementById('editExpenseId').value = expense.id;
        document.getElementById('editExpenseDate').value = expense.date;
        document.getElementById('editExpenseCategory').value = expense.category;
        document.getElementById('editExpenseDescription').value = expense.description;
        document.getElementById('editExpenseAmount').value = expense.amount;
        
        const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
        modal.show();
        
        document.getElementById('saveEditExpense').onclick = () => {
            saveEditedExpense(id);
            modal.hide();
        };
    }
    
    // Save edited expense
    function saveEditedExpense(id) {
        const index = expenses.findIndex(exp => exp.id === id);
        if (index === -1) return;
        
        expenses[index] = {
            id: id,
            date: document.getElementById('editExpenseDate').value,
            category: document.getElementById('editExpenseCategory').value,
            description: document.getElementById('editExpenseDescription').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value)
        };
        
        saveExpenses();
        renderExpenses();
        updateSummary();
        updateCharts();
    }
    
    // Delete expense
    function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateCharts();
        }
    }
    
    // Update summary cards
    function updateSummary() {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalExpensesElement.textContent = `₹${total.toFixed(2)}`;
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const monthly = expenses.reduce((sum, exp) => {
            const date = new Date(exp.date);
            if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
                return sum + exp.amount;
            }
            return sum;
        }, 0);
        
        monthlyExpensesElement.textContent = `₹${monthly.toFixed(2)}`;
        
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        const lastMonthTotal = expenses.reduce((sum, exp) => {
            const date = new Date(exp.date);
            if (date.getMonth() + 1 === lastMonth && date.getFullYear() === lastMonthYear) {
                return sum + exp.amount;
            }
            return sum;
        }, 0);
        
        lastMonthExpensesElement.textContent = `₹${lastMonthTotal.toFixed(2)}`;
    }
    
    // Initialize charts
    function initCharts() {
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
        
        categoryChart = new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2e7d32',
                        '#8bc34a',
                        '#689f38',
                        '#33691e',
                        '#558b2f',
                        '#7cb342',
                        '#9ccc65',
                        '#c5e1a5'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        monthlyTrendChart = new Chart(monthlyTrendCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Expenses (₹)',
                    data: Array(12).fill(0),
                    backgroundColor: '#8bc34a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        updateCharts();
    }
    
    // Update charts with current data
    function updateCharts() {
        // Update category chart
        const categories = {};
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });
        
        categoryChart.data.labels = Object.keys(categories);
        categoryChart.data.datasets[0].data = Object.values(categories);
        categoryChart.update();
        
        // Update monthly trend chart
        const now = new Date();
        const currentYear = now.getFullYear();
        const monthlyData = Array(12).fill(0);
        
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth();
                monthlyData[month] += expense.amount;
            }
        });
        
        monthlyTrendChart.data.datasets[0].data = monthlyData;
        monthlyTrendChart.update();
    }
    
    // Helper functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }
    
    function saveExpenses() {
        localStorage.setItem('agriExpenses', JSON.stringify(expenses));
    }
    
    // Set default date to today
    document.getElementById('expenseDate').valueAsDate = new Date();
});
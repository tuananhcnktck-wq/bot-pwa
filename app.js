// CryptoBot PWA - App Logic
let appData = {
    finance: {
        income: [],
        expense: [],
        categories: {
            income: ['Lương', 'Thưởng', 'Công việc phụ', 'Đầu tư', 'Khác'],
            expense: ['Ăn uống', 'Nhà ở', 'Di chuyển', 'Giải trí', 'Mua sắm', 'Học tập', 'Y tế', 'Khác']
        }
    },
    password: null
};

let selectedCategory = null;

// Login
function login() {
    const password = document.getElementById('passwordInput').value;
    
    if (password.length < 12) {
        alert('❌ Mật khẩu phải >= 12 ký tự!');
        return;
    }
    
    const success = loadData(password);
    
    if (!success) {
        alert('❌ Sai mật khẩu!');
        return;
    }
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    updateUI();
}

function logout() {
    if (confirm('Bạn có chắc muốn thoát?')) {
        saveData();
        location.reload();
    }
}

// Data Management with AES-256
function saveData() {
    if (!appData.password) return;
    
    try {
        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(appData), 
            appData.password
        ).toString();
        
        localStorage.setItem('cryptobot_data', encrypted);
        console.log('💾 Data saved');
    } catch (e) {
        console.error('Save error:', e);
    }
}

function loadData(password) {
    const encrypted = localStorage.getItem('cryptobot_data');
    
    if (!encrypted) {
        appData.password = password;
        saveData();
        return true;
    }
    
    try {
        const decrypted = CryptoJS.AES.decrypt(encrypted, password);
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedStr) {
            return false;
        }
        
        appData = JSON.parse(decryptedStr);
        appData.password = password;
        return true;
    } catch (e) {
        return false;
    }
}

// UI Updates
function updateUI() {
    updateDate();
    updateFinanceSummary();
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('vi-VN', options);
}

function updateFinanceSummary() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    appData.finance.income.forEach(item => {
        const date = new Date(item.date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            totalIncome += item.amount;
        }
    });
    
    appData.finance.expense.forEach(item => {
        const date = new Date(item.date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            totalExpense += item.amount;
        }
    });
    
    const remaining = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = formatMoney(totalIncome);
    document.getElementById('totalExpense').textContent = formatMoney(totalExpense);
    document.getElementById('totalRemaining').textContent = formatMoney(remaining);
    document.getElementById('totalRemaining').className = 'stat-value ' + (remaining >= 0 ? 'green' : 'red');
}

// Add Expense
function showAddExpense() {
    const amount = prompt('💸 Nhập số tiền chi (VND):');
    if (!amount) return;
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        alert('❌ Số tiền không hợp lệ!');
        return;
    }
    
    const categories = appData.finance.categories.expense;
    const category = prompt('📂 Hạng mục:\n' + categories.map((c, i) => `${i+1}. ${c}`).join('\n') + '\n\nNhập số hoặc tên:');
    
    if (!category) return;
    
    let selectedCat;
    const categoryNum = parseInt(category);
    if (!isNaN(categoryNum) && categoryNum > 0 && categoryNum <= categories.length) {
        selectedCat = categories[categoryNum - 1];
    } else {
        selectedCat = category;
    }
    
    const note = prompt('📝 Ghi chú (tùy chọn):') || '';
    
    appData.finance.expense.push({
        id: Date.now(),
        amount: amountNum,
        category: selectedCat,
        note: note,
        date: new Date().toISOString()
    });
    
    saveData();
    updateFinanceSummary();
    
    alert(`✅ Đã ghi chi tiêu: ${formatMoney(amountNum)}\n📂 ${selectedCat}`);
}

// Add Income
function showAddIncome() {
    const amount = prompt('💵 Nhập số tiền thu (VND):');
    if (!amount) return;
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        alert('❌ Số tiền không hợp lệ!');
        return;
    }
    
    const categories = appData.finance.categories.income;
    const category = prompt('📂 Hạng mục:\n' + categories.map((c, i) => `${i+1}. ${c}`).join('\n') + '\n\nNhập số hoặc tên:');
    
    if (!category) return;
    
    let selectedCat;
    const categoryNum = parseInt(category);
    if (!isNaN(categoryNum) && categoryNum > 0 && categoryNum <= categories.length) {
        selectedCat = categories[categoryNum - 1];
    } else {
        selectedCat = category;
    }
    
    const note = prompt('📝 Ghi chú (tùy chọn):') || '';
    
    appData.finance.income.push({
        id: Date.now(),
        amount: amountNum,
        category: selectedCat,
        note: note,
        date: new Date().toISOString()
    });
    
    saveData();
    updateFinanceSummary();
    
    alert(`✅ Đã ghi thu nhập: ${formatMoney(amountNum)}\n📂 ${selectedCat}`);
}

// Show History
function showHistory() {
    const allTransactions = [
        ...appData.finance.expense.map(t => ({...t, type: 'expense'})),
        ...appData.finance.income.map(t => ({...t, type: 'income'}))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allTransactions.length === 0) {
        alert('📋 Chưa có giao dịch nào!');
        return;
    }
    
    let message = '📋 LỊCH SỬ GIAO DỊCH (20 gần nhất):\n\n';
    
    allTransactions.slice(0, 20).forEach((t, i) => {
        const icon = t.type === 'income' ? '💵' : '💸';
        const date = new Date(t.date).toLocaleDateString('vi-VN');
        message += `${i+1}. ${icon} ${t.category}\n`;
        message += `   ${formatMoney(t.amount)}\n`;
        if (t.note) message += `   ${t.note}\n`;
        message += `   ${date}\n\n`;
    });
    
    alert(message);
}

// Show Stats
function showStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const expenses = appData.finance.expense.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    if (expenses.length === 0) {
        alert('📊 Chưa có dữ liệu chi tiêu tháng này!');
        return;
    }
    
    const byCategory = {};
    let total = 0;
    
    expenses.forEach(item => {
        if (!byCategory[item.category]) {
            byCategory[item.category] = 0;
        }
        byCategory[item.category] += item.amount;
        total += item.amount;
    });
    
    let message = '📊 THỐNG KÊ CHI TIÊU THÁNG NÀY:\n\n';
    
    Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
            const percent = ((amount / total) * 100).toFixed(1);
            message += `${cat}:\n${formatMoney(amount)} (${percent}%)\n\n`;
        });
    
    message += `TỔNG: ${formatMoney(total)}`;
    
    alert(message);
}

// Export Data
function exportData() {
    const dataStr = localStorage.getItem('cryptobot_data');
    if (!dataStr) {
        alert('❌ Không có dữ liệu để backup!');
        return;
    }
    
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptobot-backup-${new Date().getTime()}.enc`;
    link.click();
    
    alert('💾 Đã xuất file backup!\nLưu file này để khôi phục dữ liệu sau.');
}

// Utilities
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
}

// Enter key to login
document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('passwordInput');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});

console.log('🚀 CryptoBot PWA Ready!');

function updateCountdowns() {
    const timers = document.querySelectorAll('[data-expiry]');
    const now = new Date().getTime();

    timers.forEach(timer => {
        const expiryTime = new Date(timer.getAttribute('data-expiry')).getTime();
        const diff = expiryTime - now;
        const card = timer.closest('.deal-card');

        if (diff <= 0) {
            timer.innerHTML = `<i class="bi bi-x-circle me-1"></i>Deal Expired`;
            timer.classList.add('expired');
            if (card) {
                const actionBtn = card.querySelector('.save-deal-btn');
                if (actionBtn) {
                    actionBtn.disabled = true;
                    actionBtn.innerText = 'Expired';
                    actionBtn.classList.replace('btn-accent', 'btn-secondary');
                }
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        timer.innerHTML = `<i class="bi bi-clock-history me-1 text-warning"></i>${days}d : ${hours}h : ${mins}m : ${secs}s`;
    });
}

function setupFiltersAndSorting() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const dealsContainer = document.getElementById('dealsContainer');

    if (!dealsContainer) return;

    function filterAndSortCards() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedCategory = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const sortBy = sortSelect ? sortSelect.value : 'default';

        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp('\\b' + escapedQuery, 'i');

        const cols = Array.from(dealsContainer.querySelectorAll('.deal-col'));

        cols.forEach(col => {
            const subcat = col.getAttribute('data-subcat').toLowerCase();
            const title = col.getAttribute('data-title').toLowerCase();
            const store = col.getAttribute('data-store').toLowerCase();

            const matchesCategory = (selectedCategory === 'all' || subcat === selectedCategory);
            const matchesSearch = !searchQuery ||
                                searchRegex.test(title) ||
                                searchRegex.test(store) ||
                                searchRegex.test(subcat);

            col.style.display = (matchesCategory && matchesSearch) ? '' : 'none';
        });

        const visibleCols = cols.filter(col => col.style.display !== 'none');
        visibleCols.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price'));
            const priceB = parseFloat(b.getAttribute('data-price'));
            const discountA = parseFloat(a.getAttribute('data-discount'));
            const discountB = parseFloat(b.getAttribute('data-discount'));
            const expiryA = new Date(a.querySelector('[data-expiry]').getAttribute('data-expiry')).getTime();
            const expiryB = new Date(b.querySelector('[data-expiry]').getAttribute('data-expiry')).getTime();

            if (sortBy === 'discount-desc') return discountB - discountA;
            if (sortBy === 'price-asc') return priceA - priceB;
            if (sortBy === 'price-desc') return priceB - priceA;
            if (sortBy === 'ending-soon') return expiryA - expiryB;
            return 0;
        });

        visibleCols.forEach(col => dealsContainer.appendChild(col));
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAndSortCards();
        });
    });

    if (searchInput) searchInput.addEventListener('input', filterAndSortCards);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortCards);
}


let savedDeals = JSON.parse(localStorage.getItem('dealScoutSaved')) || [];

function renderSavedDeals() {
    const listEl = document.getElementById('savedDealsList');
    const countBadge = document.getElementById('savedCountBadge');
    const totalOriginalEl = document.getElementById('totalOriginalPrice');
    const totalFinalEl = document.getElementById('totalFinalPrice');
    const totalSavedEl = document.getElementById('totalSavedAmount');

    if (countBadge) countBadge.innerText = savedDeals.length;
    if (!listEl) return;

    if (savedDeals.length === 0) {
        listEl.innerHTML = `<p class="text-muted text-center my-4">No deals saved yet. Click "Save Deal" on any item to calculate your savings!</p>`;
        totalOriginalEl.innerText = '0 MMK';
        totalFinalEl.innerText = '0 MMK';
        totalSavedEl.innerText = '0 MMK';
        return;
    }

    let totalOriginal = 0;
    let totalFinal = 0;

    listEl.innerHTML = savedDeals.map((item, idx) => {
        totalOriginal += item.originalPrice;
        totalFinal += item.finalPrice;
        const saved = item.originalPrice - item.finalPrice;
        return `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <h6 class="mb-0 fw-bold">${item.title}</h6>
                    <small class="text-muted">${item.store} • <span class="text-success fw-semibold">Save ${saved.toLocaleString()} MMK</span></small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">${item.finalPrice.toLocaleString()} MMK</div>
                    <button class="btn btn-sm text-danger p-0" onclick="removeSavedDeal(${idx})"><i class="bi bi-trash"></i> Remove</button>
                </div>
            </div>
        `;
    }).join('');

    const totalSaved = totalOriginal - totalFinal;
    totalOriginalEl.innerText = totalOriginal.toLocaleString() + ' MMK';
    totalFinalEl.innerText = totalFinal.toLocaleString() + ' MMK';
    totalSavedEl.innerText = totalSaved.toLocaleString() + ' MMK';
}

function addSavedDeal(title, store, originalPrice, finalPrice) {
    savedDeals.push({ title, store, originalPrice, finalPrice });
    localStorage.setItem('dealScoutSaved', JSON.stringify(savedDeals));
    renderSavedDeals();
}

function removeSavedDeal(index) {
    savedDeals.splice(index, 1);
    localStorage.setItem('dealScoutSaved', JSON.stringify(savedDeals));
    renderSavedDeals();
}

document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateCountdowns, 1000);
    updateCountdowns();
    setupFiltersAndSorting();
    renderSavedDeals();
});
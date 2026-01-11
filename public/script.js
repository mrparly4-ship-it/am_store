const API_URL = '/api';
let products = [];
let currentProduct = null;
let deliveryPrice = 500;
let isAdmin = false;

// Algerian Wilayas
const wilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
    "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
    "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
    "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", 
    "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
    populateWilayas();
});

function populateWilayas() {
    const select = document.getElementById('c-state');
    wilayas.forEach((w, index) => {
        const option = document.createElement('option');
        option.value = `${index + 1} - ${w}`;
        option.textContent = `${index + 1} - ${w}`;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Modal Close
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // Buy Now -> Show Form
    document.getElementById('buy-now-btn').addEventListener('click', () => {
        document.getElementById('modal-details').classList.add('hidden');
        document.getElementById('modal-order').classList.remove('hidden');
        updateSummary();
    });

    // Back to Details
    document.getElementById('back-to-details').addEventListener('click', () => {
        document.getElementById('modal-order').classList.add('hidden');
        document.getElementById('modal-details').classList.remove('hidden');
    });

    // Order Form Submit
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);

    // Admin Trigger (Magic Click on Copyright)
    let clickCount = 0;
    const trigger = document.getElementById('copyright-trigger');
    trigger.addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 5) {
            clickCount = 0;
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('login-modal').classList.add('flex');
        }
    });

    // Login Modal Actions
    document.getElementById('close-login').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-modal').classList.remove('flex');
    });

    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Logout Action
    document.getElementById('logout-btn').addEventListener('click', () => {
        isAdmin = false;
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('admin-btn').classList.add('hidden');
        renderProducts(); // Re-render to remove delete buttons
        showToast('تم تسجيل الخروج');
    });

    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        products = await res.json();
        renderProducts();
    } catch (err) {
        console.error("Failed to fetch products", err);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">لا توجد منتجات حالياً</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative group';
        card.innerHTML = `
            <div class="relative h-48 bg-gray-100">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-gray-800 truncate">${product.name}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-blue-600 font-bold">${product.price} د.ج</span>
                    ${product.color ? `<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${product.color}</span>` : ''}
                </div>
            </div>
            ${isAdmin ? `<button onclick="deleteProduct(${product.id}, event)" class="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-70 hover:opacity-100 text-xs z-10">❌ حذف</button>` : ''}
        `;
        
        // Click to open modal (unless clicking delete)
        card.addEventListener('click', (e) => {
            if (!e.target.innerText.includes('حذف')) {
                openProduct(product);
            }
        });

        grid.appendChild(card);
    });
}

function openProduct(product) {
    currentProduct = product;
    document.getElementById('m-image').src = product.image;
    document.getElementById('m-name').textContent = product.name;
    document.getElementById('m-desc').textContent = product.description || 'لا يوجد وصف';
    document.getElementById('m-price').textContent = `${product.price} د.ج`;
    document.getElementById('m-color').textContent = product.color || 'عام';
    
    // Reset Views
    document.getElementById('modal-details').classList.remove('hidden');
    document.getElementById('modal-order').classList.add('hidden');
    
    // Show Modal
    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-modal').classList.remove('flex');
}

function updateSummary() {
    if (!currentProduct) return;
    document.getElementById('summary-price').textContent = `${currentProduct.price} د.ج`;
    document.getElementById('summary-delivery').textContent = `${deliveryPrice} د.ج`;
    document.getElementById('summary-total').textContent = `${parseInt(currentProduct.price) + deliveryPrice} د.ج`;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'جاري الإرسال...';
    btn.disabled = true;

    const customer = {
        name: document.getElementById('c-name').value,
        phone: document.getElementById('c-phone').value,
        state: document.getElementById('c-state').value,
        municipality: document.getElementById('c-muni').value,
        deliveryPrice: deliveryPrice
    };

    try {
        const res = await fetch(`${API_URL}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: currentProduct, customer })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('تم استلام طلبك! سيتم التواصل معك قريباً.');
            closeModal();
            e.target.reset();
        } else {
            showToast('حدث خطأ، يرجى المحاولة لاحقاً', true);
        }
    } catch (err) {
        showToast('خطأ في الاتصال', true);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            isAdmin = true;
            document.getElementById('admin-panel').classList.remove('hidden');
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('flex');
            document.getElementById('admin-btn').classList.remove('hidden'); // Show small indicator
            renderProducts(); // Re-render to show delete buttons
            showToast('تم تسجيل الدخول كمسؤول');
        } else {
            showToast('كلمة المرور خاطئة', true);
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleAddProduct(e) {
    e.preventDefault();
    const product = {
        name: document.getElementById('p-name').value,
        price: document.getElementById('p-price').value,
        color: document.getElementById('p-color').value,
        image: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value
    };

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        if (data.success) {
            showToast('تم إضافة المنتج');
            e.target.reset();
            fetchProducts();
        }
    } catch (err) {
        showToast('فشل الإضافة', true);
    }
}

async function deleteProduct(id, e) {
    e.stopPropagation(); // Prevent opening modal
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        fetchProducts();
        showToast('تم الحذف');
    } catch (err) {
        showToast('فشل الحذف', true);
    }
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg transition-opacity duration-300 z-[70] ${isError ? 'bg-red-600' : 'bg-gray-800'} text-white`;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

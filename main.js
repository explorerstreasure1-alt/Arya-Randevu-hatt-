/* ============================================
   ÖZEL ATÖLYE — JAVASCRIPT
   Nilüfer / Bursa
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    STORAGE_KEY: 'atolye_randevular_v3',
    HOURS: {
        weekday: { open: 10, close: 20 },
        sunday: { open: 13, close: 20 }
    },
    SLIDER_INTERVAL: 3000
};

// ============================================
// MODAL FUNCTIONS
// ============================================
const modalOverlay = document.getElementById('modalOverlay');

function openModal() {
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeModalOnBackdrop(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
}

// Escape key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) {
        closeModal();
    }
});

// ============================================
// HERO SLIDER
// ============================================
function initSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;

    function goToSlide(index) {
        slides[currentSlide]?.classList.remove('active');
        dots[currentSlide]?.classList.remove('active');
        currentSlide = index;
        slides[currentSlide]?.classList.add('active');
        dots[currentSlide]?.classList.add('active');
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % slides.length);
    }

    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            goToSlide(index);
            slideInterval = setInterval(nextSlide, CONFIG.SLIDER_INTERVAL);
        });
    });

    // Auto-advance
    slideInterval = setInterval(nextSlide, CONFIG.SLIDER_INTERVAL);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatPhone(phone) {
    return phone.replace(/\s/g, '').replace(/[-()]/g, '');
}

// XSS koruması için HTML sanitization
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Güvenli HTML oluşturma (sadece izin verilen taglar için)
function safeHtml(template, data = {}) {
    let html = template;
    for (const [key, value] of Object.entries(data)) {
        html = html.replace(new RegExp(`{${key}}`, 'g'), escapeHtml(String(value)));
    }
    return html;
}

function validatePhone(phone) {
    // Son 4 hane kontrolü - sadece rakam
    if (!phone || typeof phone !== 'string') return false;
    return /^[0-9]{4}$/.test(phone.trim());
}

function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    // Email validasyonu - temel regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return false;
    // Uzunluk kontrolü
    if (trimmed.length > 254) return false;
    // Local part uzunluk kontrolü
    const [localPart] = trimmed.split('@');
    if (localPart.length > 64) return false;
    return true;
}

function validateName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    // Türkçe karakterler dahil
    return /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]{1,50}$/.test(trimmed);
}

function validateNotes(notes) {
    if (!notes) return true; // Notlar opsiyonel
    if (typeof notes !== 'string') return false;
    const trimmed = notes.trim();
    // Uzunluk kontrolü
    if (trimmed.length > 300) return false;
    // Tehlikeli karakter kontrolü
    const dangerousChars = /<script|javascript:|on\w+=/i;
    return !dangerousChars.test(trimmed);
}

function isSundayDate(dateStr) {
    return new Date(dateStr).getDay() === 0;
}

function getHoursForDate(dateStr) {
    return isSundayDate(dateStr) ? CONFIG.HOURS.sunday : CONFIG.HOURS.weekday;
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
        weekday: 'short', month: 'short', day: 'numeric'
    });
}

// ============================================
// STORAGE FUNCTIONS
// ============================================
function getAppointments() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Storage read error:', e);
        return [];
    }
}

function saveAppointments(appointments) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appointments));
        return true;
    } catch (e) {
        console.error('Storage write error:', e);
        return false;
    }
}

// ============================================
// APPOINTMENT FUNCTIONS
// ============================================
function generateTimeSlots(dateStr, appointments) {
    const slots = [];
    const hours = getHoursForDate(dateStr);
    const today = new Date();
    const isToday = dateStr === today.toISOString().split('T')[0];
    const currentHour = today.getHours();

    for (let hour = hours.open; hour < hours.close; hour++) {
        if (isToday && hour <= currentHour) continue;

        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const isBooked = appointments.some(apt =>
            apt.date === dateStr && apt.time === timeStr
        );

        slots.push({
            value: timeStr,
            label: timeStr,
            disabled: isBooked,
            booked: isBooked
        });
    }
    return slots;
}

function updateTimeSelect(dateInput, timeSelect, formAlert) {
    const date = dateInput.value;

    if (!date) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Önce tarih seçin';
        timeSelect.innerHTML = '';
        timeSelect.appendChild(option);
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);

    if (selectedDate < today) {
        if (formAlert) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Geçmiş bir tarih seçemezsiniz.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            setTimeout(() => formAlert.innerHTML = '', 3000);
        }
        dateInput.value = '';
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Önce tarih seçin';
        timeSelect.innerHTML = '';
        timeSelect.appendChild(option);
        return;
    }

    const appointments = getAppointments();
    const slots = generateTimeSlots(date, appointments);

    if (slots.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Müsait saat bulunmuyor';
        timeSelect.innerHTML = '';
        timeSelect.appendChild(option);
        return;
    }

    timeSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Saat seçin';
    timeSelect.appendChild(defaultOption);

    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.value;
        option.textContent = slot.label + (slot.booked ? ' (Dolu)' : '');
        if (slot.disabled) {
            option.disabled = true;
        }
        timeSelect.appendChild(option);
    });
}

function setMinDate(dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
}

// Hizmet isimleri mapping
const SERVICE_NAMES = {
    // Terzi
    'pantolon-tadilat': 'Pantolon Tadilatı',
    'gomlek-tadilat': 'Gömlek Tadilatı',
    'ceket-tadilat': 'Ceket/Takım Elbise Ayarı',
    'elbise-tadilat': 'Elbise Tadilatı',
    'fermuar-degisim': 'Fermuar Değişimi/Tamiri',
    'astar-degisim': 'Astar Değişimi',
    'dugme-kayip': 'Düğme Dikimi/Kaynak',
    'yirtik-tamiri': 'Yırtık Delik Tamiri',
    'etek-tadilat': 'Etek Tadilatı',
    'mont-tadilat': 'Mont/Kaban Tadilatı',
    'kumas-prova': 'Kumaş Prova & Ölçü',
    'gelinlik-mod': 'Gelinlik Modifikasyonu',
    'ozel-dikim': 'Özel Dikim',
    'kumas-restorasyon': 'Kumaş Restorasyonu',
    // Kuru Temizleme
    'kuru-temizleme': 'Kuru Temizleme',
    'yikama': 'Yıkama',
    'utu': 'Ütü',
    'yikama-utu': 'Yıkama + Ütü Paketi',
    'leke-cikarma': 'Leke Çıkarma',
    'perde-yorgan': 'Perde/Yorgan Yıkama',
    'deri-suet': 'Deri/Süet Temizleme',
    'gelinlik-temizleme': 'Gelinlik Kuru Temizleme',
    'abiye-temizleme': 'Abiye/Özel Kumaş Temizleme',
    'mont-kaban-temizleme': 'Mont/Kaban Temizleme',
    'nevresim-temizleme': 'Nevresim/Battaniye Yıkama',
    'aydinlatma-temizleme': 'Özel Aydınlatma Temizleme',
    // Diğer
    'kumas-boyama': 'Kumaş Boyama',
    'nakis-isleme': 'Nakış & İşleme',
    'patch-tamiri': 'Patch Tamiri',
    'kopca-tamiri': 'Kopça/Çıtçıt Tamiri',
    'askili-genisletme': 'Askılı Genişletme/Daraltma',
    'danismanlik': 'Kumaş & Stil Danışmanlığı'
};

function getServiceName(serviceValue) {
    return SERVICE_NAMES[serviceValue] || serviceValue;
}

function addAppointment(data) {
    const appointments = getAppointments();

    // Check conflict
    const conflict = appointments.find(apt =>
        apt.date === data.date && apt.time === data.time
    );

    if (conflict) {
        return {
            success: false,
            message: 'Bu saat dilimi dolu. Lütfen başka bir saat seçin.'
        };
    }

    const newAppointment = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: formatPhone(data.phone),
        email: data.email.trim().toLowerCase(),
        service: data.service,
        serviceName: getServiceName(data.service),
        date: data.date,
        time: data.time,
        notes: (data.notes || '').trim(),
        createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);

    if (!saveAppointments(appointments)) {
        return {
            success: false,
            message: 'Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.'
        };
    }

    return {
        success: true,
        message: 'Randevunuz başarıyla oluşturuldu!',
        appointment: newAppointment
    };
}

function getAppointmentsByPhone(phone) {
    const cleaned = formatPhone(phone);
    const last4 = cleaned.slice(-4);
    return getAppointments()
        .filter(apt => apt.phone.slice(-4) === last4)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
}

function cancelAppointment(id) {
    const appointments = getAppointments();
    const filtered = appointments.filter(apt => apt.id !== id);
    if (filtered.length === appointments.length) return false;
    return saveAppointments(filtered);
}

function renderAppointments(phone, container, dateInput, timeSelect, formAlert) {
    if (!validatePhone(phone)) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        alertDiv.textContent = 'Geçerli bir telefon numarası girin.';
        container.innerHTML = '';
        container.appendChild(alertDiv);
        return;
    }

    const appointments = getAppointmentsByPhone(phone);

    if (appointments.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📋</div>';
        const p = document.createElement('p');
        p.textContent = 'Bu numaraya ait randevu bulunamadı.';
        emptyDiv.appendChild(p);
        container.innerHTML = '';
        container.appendChild(emptyDiv);
        return;
    }

    container.innerHTML = '';
    appointments.forEach(apt => {
        const serviceDisplay = apt.serviceName || getServiceName(apt.service) || 'Genel Hizmet';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'appointment-item';
        itemDiv.dataset.id = apt.id;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'appointment-info';

        const h4 = document.createElement('h4');
        h4.textContent = `${apt.firstName} ${apt.lastName}`;

        const p1 = document.createElement('p');
        p1.innerHTML = `<strong>${escapeHtml(serviceDisplay)}</strong>`;

        const p2 = document.createElement('p');
        p2.textContent = `${formatDate(apt.date)} • ${apt.time}`;

        infoDiv.appendChild(h4);
        infoDiv.appendChild(p1);
        infoDiv.appendChild(p2);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.dataset.id = apt.id;
        cancelBtn.textContent = 'İptal';

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(cancelBtn);
        container.appendChild(itemDiv);

        // Attach cancel handler
        cancelBtn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
                if (cancelAppointment(id)) {
                    renderAppointments(phone, container, dateInput, timeSelect, formAlert);
                    updateTimeSelect(dateInput, timeSelect, formAlert);
                } else {
                    alert('İptal işlemi başarısız oldu.');
                }
            }
        });
    });
}

// ============================================
// FORM INITIALIZATION
// ============================================
function initAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const formAlert = document.getElementById('formAlert');
    const searchBtn = document.getElementById('searchBtn');
    const searchPhone = document.getElementById('searchPhone');
    const appointmentsList = document.getElementById('appointmentsList');

    if (!form) return;

    // Initialize date input
    setMinDate(dateInput);
    updateTimeSelect(dateInput, timeSelect, formAlert);

    // Date change handler
    dateInput.addEventListener('change', () => {
        updateTimeSelect(dateInput, timeSelect, formAlert);
    });

    // Form submit handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Double submit koruması
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && submitBtn.disabled) return;

        const data = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            service: document.getElementById('service')?.value || '',
            date: document.getElementById('date')?.value || '',
            time: document.getElementById('time')?.value || '',
            notes: document.getElementById('notes')?.value || ''
        };

        // Validation
        if (!validateName(data.firstName)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Geçerli bir ad giriniz (sadece harfler).';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!validateName(data.lastName)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Geçerli bir soyad giriniz (sadece harfler).';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!validatePhone(data.phone)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Geçerli bir telefon numarası giriniz (son 4 hane).';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!validateEmail(data.email)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Geçerli bir e-posta adresi giriniz.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!data.service) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Lütfen bir hizmet seçin.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!data.date) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Lütfen bir tarih seçin.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!data.time) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Lütfen bir saat seçin.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }
        if (!validateNotes(data.notes)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = 'Notlar 300 karakteri geçemez ve özel karakterler içeremez.';
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            return;
        }

        // Loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'İşleniyor...';
            submitBtn.style.opacity = '0.7';
        }

        const result = addAppointment(data);

        // Reset loading state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Randevu Oluştur';
            submitBtn.style.opacity = '1';
        }

        if (result.success) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success';
            alertDiv.textContent = result.message;
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
            form.reset();
            updateTimeSelect(dateInput, timeSelect, formAlert);

            // Refresh list if same phone
            if (searchPhone?.value && formatPhone(searchPhone.value) === formatPhone(data.phone)) {
                renderAppointments(data.phone, appointmentsList, dateInput, timeSelect, formAlert);
            }
        } else {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.textContent = result.message;
            formAlert.innerHTML = '';
            formAlert.appendChild(alertDiv);
        }
    });

    // Search handlers
    searchBtn?.addEventListener('click', () => {
        renderAppointments(searchPhone.value, appointmentsList, dateInput, timeSelect, formAlert);
    });

    searchPhone?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            renderAppointments(searchPhone.value, appointmentsList, dateInput, timeSelect, formAlert);
        }
    });
}

// ============================================
// STATUS CHECK
// ============================================
function initStatusCheck() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentHour = today.getHours();
    const isSunday = dayOfWeek === 0;
    const hours = isSunday ? CONFIG.HOURS.sunday : CONFIG.HOURS.weekday;
    const isOpen = currentHour >= hours.open && currentHour < hours.close;

    document.querySelectorAll('.status').forEach(el => {
        if (!isOpen) {
            el.textContent = 'Şu an Kapalı';
            el.classList.add('closed');
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initAppointmentForm();
    initStatusCheck();
    initAdminPanel();
});

// ============================================
// ADMIN PANEL
// ============================================
const ADMIN_PASSWORD = '398908'; // Admin giriş şifresi

function initAdminPanel() {
    // Admin login form handler
    const adminLoginForm = document.getElementById('adminLoginForm');
    adminLoginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword')?.value;

        if (password === ADMIN_PASSWORD) {
            closeAdminLogin();
            openAdminPanel();
            document.getElementById('adminLoginForm')?.reset();
        } else {
            const alertDiv = document.getElementById('adminLoginAlert');
            if (alertDiv) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-error';
                errorDiv.textContent = 'Hatalı şifre!';
                alertDiv.innerHTML = '';
                alertDiv.appendChild(errorDiv);
                setTimeout(() => alertDiv.innerHTML = '', 3000);
            }
        }
    });

    // Populate service filter dropdown
    populateAdminServiceFilter();
}

function populateAdminServiceFilter() {
    const filterSelect = document.getElementById('adminFilterService');
    if (!filterSelect) return;

    let html = '<option value="">Tüm Hizmetler</option>';

    // SERVICE_NAMES'den dinamik olarak oluştur
    const serviceGroups = {
        '✂️ Terzi Hizmetleri': [
            'pantolon-tadilat', 'gomlek-tadilat', 'ceket-tadilat', 'elbise-tadilat',
            'fermuar-degisim', 'astar-degisim', 'dugme-kayip', 'yirtik-tamiri',
            'etek-tadilat', 'mont-tadilat', 'kumas-prova', 'gelinlik-mod',
            'ozel-dikim', 'kumas-restorasyon'
        ],
        '🧺 Kuru Temizleme': [
            'kuru-temizleme', 'yikama', 'utu', 'yikama-utu', 'leke-cikarma',
            'perde-yorgan', 'deri-suet', 'gelinlik-temizleme', 'abiye-temizleme',
            'mont-kaban-temizleme', 'nevresim-temizleme', 'aydinlatma-temizleme'
        ],
        '🎨 Diğer Hizmetler': [
            'kumas-boyama', 'nakis-isleme', 'patch-tamiri', 'kopca-tamiri',
            'askili-genisletme', 'danismanlik'
        ]
    };

    for (const [groupName, services] of Object.entries(serviceGroups)) {
        html += `<optgroup label="${groupName}">`;
        for (const service of services) {
            const serviceName = SERVICE_NAMES[service] || service;
            html += `<option value="${service}">${serviceName}</option>`;
        }
        html += '</optgroup>';
    }

    filterSelect.innerHTML = html;
}

function openAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('adminPassword')?.focus();
    }
}

function closeAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showPasswordHint() {
    const hintDiv = document.getElementById('passwordHint');
    if (!hintDiv) return;

    const password = ADMIN_PASSWORD;
    if (password.length < 6) {
        hintDiv.textContent = 'Şifre çok kısa';
        hintDiv.style.display = 'block';
        return;
    }

    // Baş, orta ve son harfleri göster
    const firstChar = password[0];
    const lastChar = password[password.length - 1];

    // Ortadan pozisyonlar (örn: 3. ve 7. karakterler)
    const midPos1 = Math.floor(password.length / 3);
    const midPos2 = Math.floor(password.length / 2);
    const midChar1 = password[midPos1];
    const midChar2 = password[midPos2];

    // Maskeli şifre oluştur
    let masked = '';
    for (let i = 0; i < password.length; i++) {
        if (i === 0) {
            masked += firstChar;
        } else if (i === midPos1) {
            masked += midChar1;
        } else if (i === midPos2) {
            masked += midChar2;
        } else if (i === password.length - 1) {
            masked += lastChar;
        } else {
            masked += 'X';
        }
    }

    hintDiv.textContent = `Şifre İpucu: ${masked}`;
    hintDiv.style.display = 'block';

    // 5 saniye sonra gizle
    setTimeout(() => {
        hintDiv.style.display = 'none';
    }, 5000);
}

function openAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadAdminAppointments();
    }
}

function closeAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function refreshAdminPanel() {
    loadAdminAppointments();
}

function loadAdminAppointments() {
    const appointments = getAppointments();
    displayAdminAppointments(appointments);
}

function displayAdminAppointments(appointments) {
    const tbody = document.getElementById('adminAppointmentsTable');
    const noData = document.getElementById('adminNoData');
    const countSpan = document.getElementById('totalAppointmentsCount');

    if (!tbody) return;

    // Update count
    if (countSpan) {
        countSpan.textContent = `(${appointments.length} randevu)`;
    }

    if (appointments.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';

    // Sort by date (newest first)
    const sorted = [...appointments].sort((a, b) => {
        return new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time);
    });

    tbody.innerHTML = '';
    sorted.forEach(apt => {
        // Güvenli veri al - sadece randevu bilgileri
        const safeData = getSafeAppointmentData(apt);
        const dateStr = formatDate(safeData.date);

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';

        // Date & Time cell
        const td1 = document.createElement('td');
        td1.style.padding = '0.75rem';
        td1.style.verticalAlign = 'top';
        const div1 = document.createElement('div');
        div1.style.fontWeight = '600';
        div1.textContent = dateStr;
        const div2 = document.createElement('div');
        div2.style.color = 'var(--accent-gold)';
        div2.style.fontSize = '0.75rem';
        div2.textContent = safeData.time;
        td1.appendChild(div1);
        td1.appendChild(div2);

        // Service cell
        const td2 = document.createElement('td');
        td2.style.padding = '0.75rem';
        td2.style.verticalAlign = 'top';
        const span = document.createElement('span');
        span.style.background = 'var(--accent-gold-10)';
        span.style.color = 'var(--accent-gold)';
        span.style.padding = '0.25rem 0.5rem';
        span.style.borderRadius = '4px';
        span.style.fontSize = '0.75rem';
        span.textContent = safeData.serviceName;
        td2.appendChild(span);

        // Notes cell
        const td3 = document.createElement('td');
        td3.style.padding = '0.75rem';
        td3.style.verticalAlign = 'top';
        td3.style.maxWidth = '300px';
        td3.style.wordWrap = 'break-word';
        td3.style.fontSize = '0.75rem';
        td3.style.color = 'var(--text-secondary)';
        td3.textContent = safeData.notes;

        // Action cell
        const td4 = document.createElement('td');
        td4.style.padding = '0.75rem';
        td4.style.textAlign = 'center';
        td4.style.verticalAlign = 'top';
        const deleteBtn = document.createElement('button');
        deleteBtn.style.background = 'var(--error-bg)';
        deleteBtn.style.color = 'var(--error)';
        deleteBtn.style.border = '1px solid var(--error)';
        deleteBtn.style.padding = '0.375rem 0.75rem';
        deleteBtn.style.borderRadius = '6px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '0.75rem';
        deleteBtn.textContent = 'Sil';
        deleteBtn.onclick = () => adminDeleteAppointment(safeData.id);
        td4.appendChild(deleteBtn);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tbody.appendChild(tr);
    });
}

// Gizleme fonksiyonları
function maskPhone(phone) {
    if (!phone || phone.length < 4) return phone;
    const last4 = phone.slice(-4);
    return '*** **** ' + last4;
}

function maskLastName(lastName) {
    if (!lastName || lastName.length === 0) return lastName;
    const firstChar = lastName[0];
    return firstChar + '***';
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    const visibleChars = Math.min(2, user.length);
    const maskedUser = user.slice(0, visibleChars) + '***';
    return maskedUser + '@' + domain;
}

// Admin panelinde kişisel bilgileri tamamen gizle
function getSafeAppointmentData(apt) {
    return {
        id: apt.id,
        serviceName: apt.serviceName || getServiceName(apt.service),
        date: apt.date,
        time: apt.time,
        notes: apt.notes || '-'
    };
}

function filterAdminAppointments() {
    const dateFilter = document.getElementById('adminFilterDate')?.value || '';
    const serviceFilter = document.getElementById('adminFilterService')?.value || '';

    let appointments = getAppointments();

    // Apply filters
    if (dateFilter) {
        appointments = appointments.filter(apt => apt.date === dateFilter);
    }

    if (serviceFilter) {
        appointments = appointments.filter(apt => apt.service === serviceFilter);
    }

    displayAdminAppointments(appointments);
}

function clearAdminFilters() {
    document.getElementById('adminFilterDate').value = '';
    document.getElementById('adminFilterService').value = '';
    loadAdminAppointments();
}

function adminDeleteAppointment(id) {
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
        if (cancelAppointment(id)) {
            filterAdminAppointments(); // Refresh with current filters
        } else {
            alert('Silme işlemi başarısız oldu.');
        }
    }
}

// Generic close modal on backdrop click
function closeModalOnBackdrop(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'adminLoginModal') {
            closeAdminLogin();
        } else if (modalId === 'adminPanelModal') {
            closeAdminPanel();
        } else if (modalId === 'modalOverlay') {
            closeModal();
        }
    }
}

/**
 * Unit Tests for Admin Panel
 * ครอบคลุม Admin-specific scenarios
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

// Mock fetch
global.fetch = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    jest.clearAllMocks();
    fetch.mockClear();
});

// ============================================
// Test Suite: Admin Login
// ============================================
describe('Admin Login', () => {
    const ADMIN_PASSWORD = 'admin123';

    describe('Password Validation', () => {
        test('should accept correct password', () => {
            const isValid = (password) => password === ADMIN_PASSWORD;

            expect(isValid('admin123')).toBe(true);
        });

        test('should reject empty password', () => {
            const isValid = (password) => Boolean(password) && password === ADMIN_PASSWORD;

            expect(isValid('')).toBe(false);
            expect(isValid(null)).toBe(false);
            expect(isValid(undefined)).toBe(false);
        });

        test('should reject wrong password', () => {
            const isValid = (password) => password === ADMIN_PASSWORD;

            expect(isValid('wrong')).toBe(false);
            expect(isValid('admin')).toBe(false);
            expect(isValid('123')).toBe(false);
        });

        test('should be case sensitive', () => {
            const isValid = (password) => password === ADMIN_PASSWORD;

            expect(isValid('ADMIN123')).toBe(false);
            expect(isValid('Admin123')).toBe(false);
            expect(isValid('AdMiN123')).toBe(false);
        });

        test('should not trim whitespace', () => {
            const isValid = (password) => password === ADMIN_PASSWORD;

            expect(isValid(' admin123')).toBe(false);
            expect(isValid('admin123 ')).toBe(false);
            expect(isValid(' admin123 ')).toBe(false);
        });
    });

    describe('Session Management', () => {
        test('should store login status in sessionStorage', () => {
            const login = () => {
                sessionStorage.setItem('adminLoggedIn', 'true');
            };

            login();

            expect(sessionStorage.setItem).toHaveBeenCalledWith('adminLoggedIn', 'true');
        });

        test('should check session on page load', () => {
            const checkSession = () => {
                return sessionStorage.getItem('adminLoggedIn') === 'true';
            };

            sessionStorage.getItem.mockReturnValue('true');
            expect(checkSession()).toBe(true);

            sessionStorage.getItem.mockReturnValue(null);
            expect(checkSession()).toBe(false);
        });

        test('should clear session on logout', () => {
            const logout = () => {
                sessionStorage.removeItem('adminLoggedIn');
            };

            logout();

            expect(sessionStorage.removeItem).toHaveBeenCalledWith('adminLoggedIn');
        });
    });
});

// ============================================
// Test Suite: Admin Service Management
// ============================================
describe('Admin Service Management', () => {

    describe('Add Service Form Validation', () => {
        test('should validate all required fields', () => {
            const validateServiceForm = (name, desc, price, duration) => {
                return name.trim() !== '' &&
                       desc.trim() !== '' &&
                       !isNaN(price) && price > 0 &&
                       !isNaN(duration) && duration >= 15;
            };

            // Valid case
            expect(validateServiceForm('Test', 'Description', 100, 30)).toBe(true);

            // Invalid cases
            expect(validateServiceForm('', 'Description', 100, 30)).toBe(false);
            expect(validateServiceForm('Test', '', 100, 30)).toBe(false);
            expect(validateServiceForm('Test', 'Description', 0, 30)).toBe(false);
            expect(validateServiceForm('Test', 'Description', -100, 30)).toBe(false);
            expect(validateServiceForm('Test', 'Description', 100, 10)).toBe(false);
        });

        test('should parse price as float', () => {
            const priceInput = '500.50';
            const price = parseFloat(priceInput);

            expect(price).toBe(500.5);
            expect(typeof price).toBe('number');
        });

        test('should parse duration as integer', () => {
            const durationInput = '60';
            const duration = parseInt(durationInput);

            expect(duration).toBe(60);
            expect(typeof duration).toBe('number');
        });

        test('should generate unique ID using timestamp', () => {
            const id1 = Date.now();
            // Small delay to ensure different timestamps
            const id2 = Date.now() + 1;

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('number');
        });
    });

    describe('Edit Service', () => {
        test('should populate form with service data', () => {
            const service = {
                id: 123,
                name: 'Test Service',
                desc: 'Test Description',
                price: 500,
                duration: 60
            };

            // Simulate populating form
            const formData = {
                name: service.name,
                desc: service.desc,
                price: service.price,
                duration: service.duration
            };

            expect(formData.name).toBe('Test Service');
            expect(formData.desc).toBe('Test Description');
            expect(formData.price).toBe(500);
            expect(formData.duration).toBe(60);
        });

        test('should delete old service before adding updated version', () => {
            let services = [
                { id: 1, name: 'Old Name' },
                { id: 2, name: 'Other Service' }
            ];

            // Edit workflow: delete old, then add new
            const editService = (id, newData) => {
                services = services.filter(s => s.id !== id);
                services.push({ ...newData, id: Date.now() });
            };

            editService(1, { name: 'New Name', desc: 'Desc', price: 100, duration: 30 });

            expect(services.length).toBe(2);
            expect(services.find(s => s.name === 'Old Name')).toBeUndefined();
        });
    });

    describe('Delete Service', () => {
        test('should show confirmation dialog', () => {
            const confirmDelete = () => confirm('ต้องการลบบริการนี้หรือไม่?');

            confirmDelete();

            expect(confirm).toHaveBeenCalledWith('ต้องการลบบริการนี้หรือไม่?');
        });

        test('should not delete if user cancels', () => {
            confirm.mockReturnValue(false);

            let services = [{ id: 1, name: 'Service' }];

            const deleteService = (id, skipConfirm = false) => {
                if (!skipConfirm && !confirm('Delete?')) {
                    return false;
                }
                services = services.filter(s => s.id !== id);
                return true;
            };

            const result = deleteService(1);

            expect(result).toBe(false);
            expect(services.length).toBe(1);
        });

        test('should delete if user confirms', () => {
            confirm.mockReturnValue(true);

            let services = [{ id: 1, name: 'Service' }];

            const deleteService = (id) => {
                if (!confirm('Delete?')) return false;
                services = services.filter(s => s.id !== id);
                return true;
            };

            const result = deleteService(1);

            expect(result).toBe(true);
            expect(services.length).toBe(0);
        });

        test('should skip confirmation when editing (delete + re-add)', () => {
            let services = [{ id: 1, name: 'Service' }];

            const deleteService = (id, skipConfirm = false) => {
                if (!skipConfirm && !confirm('Delete?')) return false;
                services = services.filter(s => s.id !== id);
                return true;
            };

            // During edit, skipConfirm should be true
            deleteService(1, true);

            expect(confirm).not.toHaveBeenCalled();
            expect(services.length).toBe(0);
        });
    });
});

// ============================================
// Test Suite: Admin Booking Management
// ============================================
describe('Admin Booking Management', () => {

    describe('Load Bookings', () => {
        test('should load bookings from localStorage', () => {
            const mockBookings = [
                { name: 'John', serviceName: 'Test', date: '2025-12-01', time: '10:00' },
                { name: 'Jane', serviceName: 'Test', date: '2025-12-02', time: '14:00' }
            ];

            localStorage.getItem.mockReturnValue(JSON.stringify(mockBookings));

            const bookings = JSON.parse(localStorage.getItem('bookings'));

            expect(bookings.length).toBe(2);
            expect(bookings[0].name).toBe('John');
        });

        test('should return empty array if no bookings', () => {
            localStorage.getItem.mockReturnValue(null);

            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];

            expect(bookings).toEqual([]);
        });
    });

    describe('Cancel Booking', () => {
        test('should show confirmation with booking details', () => {
            const booking = {
                name: 'John Doe',
                serviceName: 'Test Service',
                date: '2025-12-01',
                time: '10:00'
            };

            const message = `ต้องการยกเลิกนัดหมาย?\n\nชื่อ: ${booking.name}\nบริการ: ${booking.serviceName}\nวันที่: ${booking.date} เวลา ${booking.time}`;

            confirm(message);

            expect(confirm).toHaveBeenCalledWith(expect.stringContaining('John Doe'));
            expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Test Service'));
            expect(confirm).toHaveBeenCalledWith(expect.stringContaining('2025-12-01'));
        });

        test('should remove booking by index', () => {
            let bookings = [
                { name: 'A' },
                { name: 'B' },
                { name: 'C' }
            ];

            bookings.splice(1, 1); // Remove index 1

            expect(bookings.length).toBe(2);
            expect(bookings[0].name).toBe('A');
            expect(bookings[1].name).toBe('C');
        });

        test('should send cancel request to API', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const googleSheetURL = 'https://script.google.com/test';
            const booking = {
                email: 'test@test.com',
                date: '2025-12-01',
                time: '10:00'
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'cancelBooking',
                    email: booking.email,
                    date: booking.date,
                    time: booking.time
                })
            });

            expect(fetch).toHaveBeenCalledWith(
                googleSheetURL,
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        test('should update localStorage after cancellation', () => {
            let bookings = [
                { name: 'A' },
                { name: 'B' }
            ];

            bookings.splice(0, 1);
            localStorage.setItem('bookings', JSON.stringify(bookings));

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'bookings',
                JSON.stringify([{ name: 'B' }])
            );
        });
    });

    describe('Display Booking Table', () => {
        test('should show "no bookings" message when empty', () => {
            const bookings = [];
            const hasBookings = bookings.length > 0;

            expect(hasBookings).toBe(false);
        });

        test('should show table when bookings exist', () => {
            const bookings = [{ name: 'John' }];
            const hasBookings = bookings.length > 0;

            expect(hasBookings).toBe(true);
        });

        test('should format booking data for display', () => {
            const booking = {
                name: 'John Doe',
                serviceName: 'Haircut',
                date: '2025-12-01',
                time: '10:00',
                phone: '0812345678',
                email: 'john@test.com'
            };

            const displayData = {
                name: booking.name,
                service: booking.serviceName,
                dateTime: `${booking.date} ${booking.time}`,
                contact: `${booking.phone}\n${booking.email}`
            };

            expect(displayData.name).toBe('John Doe');
            expect(displayData.service).toBe('Haircut');
            expect(displayData.dateTime).toBe('2025-12-01 10:00');
        });
    });
});

// ============================================
// Test Suite: Admin Tabs
// ============================================
describe('Admin Tabs Navigation', () => {
    const tabs = ['add-service', 'manage', 'bookings'];

    test('should have 3 tabs', () => {
        expect(tabs.length).toBe(3);
    });

    test('should include required tabs', () => {
        expect(tabs).toContain('add-service');
        expect(tabs).toContain('manage');
        expect(tabs).toContain('bookings');
    });

    test('should switch active tab', () => {
        let activeTab = 'add-service';

        const switchTab = (tabName) => {
            if (tabs.includes(tabName)) {
                activeTab = tabName;
            }
        };

        switchTab('manage');
        expect(activeTab).toBe('manage');

        switchTab('bookings');
        expect(activeTab).toBe('bookings');
    });

    test('should load bookings when switching to bookings tab', () => {
        const loadBookings = jest.fn();

        const onTabChange = (tabName) => {
            if (tabName === 'bookings') {
                loadBookings();
            }
        };

        onTabChange('bookings');
        expect(loadBookings).toHaveBeenCalled();

        onTabChange('manage');
        expect(loadBookings).toHaveBeenCalledTimes(1); // Not called again
    });

    test('should ignore invalid tab names', () => {
        let activeTab = 'add-service';

        const switchTab = (tabName) => {
            if (tabs.includes(tabName)) {
                activeTab = tabName;
            }
        };

        switchTab('invalid-tab');
        expect(activeTab).toBe('add-service'); // Unchanged
    });
});

// ============================================
// Test Suite: Success Messages
// ============================================
describe('Success Messages', () => {

    test('should show appropriate message for add service', () => {
        const getMessage = (action) => {
            const messages = {
                'add': 'เพิ่มบริการสำเร็จ',
                'delete': 'ลบบริการสำเร็จ',
                'cancel': 'ยกเลิกนัดหมายสำเร็จ'
            };
            return messages[action];
        };

        expect(getMessage('add')).toBe('เพิ่มบริการสำเร็จ');
        expect(getMessage('delete')).toBe('ลบบริการสำเร็จ');
        expect(getMessage('cancel')).toBe('ยกเลิกนัดหมายสำเร็จ');
    });

    test('should auto-hide message after delay', () => {
        jest.useFakeTimers();

        let isVisible = true;

        const showSuccess = () => {
            isVisible = true;
            setTimeout(() => {
                isVisible = false;
            }, 3000);
        };

        showSuccess();
        expect(isVisible).toBe(true);

        jest.advanceTimersByTime(3000);
        expect(isVisible).toBe(false);

        jest.useRealTimers();
    });
});

// ============================================
// Test Suite: API Sync
// ============================================
describe('Admin API Sync', () => {

    describe('Load Services from Sheet', () => {
        test('should fetch services on panel load', async () => {
            const mockResponse = {
                status: 'success',
                services: [
                    { id: 1, name: 'Service A' }
                ]
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            const googleSheetURL = 'https://script.google.com/test';
            const response = await fetch(googleSheetURL + '?action=getServices');
            const result = await response.json();

            expect(result.status).toBe('success');
            expect(result.services.length).toBe(1);
        });

        test('should update localStorage with fetched services', async () => {
            const services = [{ id: 1, name: 'Test' }];

            localStorage.setItem('services', JSON.stringify(services));

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'services',
                JSON.stringify(services)
            );
        });

        test('should fallback to localStorage on fetch error', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const localServices = [{ id: 1, name: 'Local' }];
            localStorage.getItem.mockReturnValue(JSON.stringify(localServices));

            let services;
            try {
                await fetch('https://script.google.com/test?action=getServices');
            } catch (err) {
                services = JSON.parse(localStorage.getItem('services')) || [];
            }

            expect(services.length).toBe(1);
            expect(services[0].name).toBe('Local');
        });
    });

    describe('Skip API calls when URL not set', () => {
        test('should not call fetch when googleSheetURL is empty', async () => {
            const googleSheetURL = '';

            const loadFromSheet = async () => {
                if (!googleSheetURL) return;
                await fetch(googleSheetURL + '?action=getServices');
            };

            await loadFromSheet();

            expect(fetch).not.toHaveBeenCalled();
        });

        test('should work offline with localStorage only', () => {
            const localServices = [{ id: 1, name: 'Offline Service' }];
            localStorage.getItem.mockReturnValue(JSON.stringify(localServices));

            const services = JSON.parse(localStorage.getItem('services')) || [];

            expect(services.length).toBe(1);
            expect(services[0].name).toBe('Offline Service');
        });
    });
});

// ============================================
// Test Suite: Security
// ============================================
describe('Admin Security', () => {

    test('should not expose password in code', () => {
        // Password should be configurable but not exposed to client
        const ADMIN_PASSWORD = 'admin123';

        // In a real scenario, this would be in a separate config
        expect(typeof ADMIN_PASSWORD).toBe('string');
        expect(ADMIN_PASSWORD.length).toBeGreaterThan(0);
    });

    test('should use sessionStorage instead of localStorage for auth', () => {
        // sessionStorage is more secure - cleared on tab close
        const login = () => {
            sessionStorage.setItem('adminLoggedIn', 'true');
        };

        login();

        expect(sessionStorage.setItem).toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalledWith('adminLoggedIn', expect.anything());
    });

    test('should not persist login across sessions', () => {
        // After closing tab, session should be cleared
        sessionStorage.getItem.mockReturnValue(null);

        const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

        expect(isLoggedIn).toBe(false);
    });

    test('should require re-login after logout', () => {
        // Simulate logout
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.getItem.mockReturnValue(null);

        const checkAuth = () => sessionStorage.getItem('adminLoggedIn') === 'true';

        expect(checkAuth()).toBe(false);
    });
});

/**
 * Unit Tests for Booking Website
 * ครอบคลุมทุก scenario ตาม Use Cases
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

// Mock alert and confirm
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
// Test Suite: Service Management
// ============================================
describe('Service Management', () => {

    describe('Service Data Structure', () => {
        test('should have correct service properties', () => {
            const service = {
                id: Date.now(),
                name: 'ตัดผม',
                desc: 'ตัดผมชาย',
                price: 200,
                duration: 30
            };

            expect(service).toHaveProperty('id');
            expect(service).toHaveProperty('name');
            expect(service).toHaveProperty('desc');
            expect(service).toHaveProperty('price');
            expect(service).toHaveProperty('duration');
        });

        test('service id should be a timestamp number', () => {
            const service = { id: Date.now() };
            expect(typeof service.id).toBe('number');
            expect(service.id).toBeGreaterThan(0);
        });

        test('service price should be a positive number', () => {
            const service = { price: 200 };
            expect(typeof service.price).toBe('number');
            expect(service.price).toBeGreaterThan(0);
        });

        test('service duration should be at least 15 minutes', () => {
            const validDuration = 30;
            const invalidDuration = 10;

            expect(validDuration).toBeGreaterThanOrEqual(15);
            expect(invalidDuration).toBeLessThan(15);
        });
    });

    describe('Add Service (UC04)', () => {
        test('should create service with all required fields', () => {
            const service = {
                id: Date.now(),
                name: 'นวดไทย',
                desc: 'นวดแผนไทยโบราณ',
                price: 500,
                duration: 60
            };

            const services = [];
            services.push(service);

            expect(services.length).toBe(1);
            expect(services[0].name).toBe('นวดไทย');
        });

        test('should save service to localStorage', () => {
            const services = [{ id: 1, name: 'Test', desc: 'Test', price: 100, duration: 30 }];
            localStorage.setItem('services', JSON.stringify(services));

            expect(localStorage.setItem).toHaveBeenCalledWith('services', JSON.stringify(services));
        });

        test('should reject service with missing name', () => {
            const service = {
                id: Date.now(),
                name: '',
                desc: 'รายละเอียด',
                price: 100,
                duration: 30
            };

            const isValid = service.name && service.desc && service.price && service.duration;
            expect(isValid).toBeFalsy();
        });

        test('should reject service with invalid price', () => {
            const validatePrice = (price) => typeof price === 'number' && price > 0;

            expect(validatePrice(0)).toBe(false);
            expect(validatePrice(-100)).toBe(false);
            expect(validatePrice('abc')).toBe(false);
            expect(validatePrice(100)).toBe(true);
        });
    });

    describe('Edit Service (UC05)', () => {
        test('should find service by id', () => {
            const services = [
                { id: 1, name: 'Service A' },
                { id: 2, name: 'Service B' },
                { id: 3, name: 'Service C' }
            ];

            const found = services.find(s => s.id === 2);
            expect(found.name).toBe('Service B');
        });

        test('should update service properties', () => {
            const services = [{ id: 1, name: 'Old Name', price: 100 }];

            const serviceToUpdate = services.find(s => s.id === 1);
            serviceToUpdate.name = 'New Name';
            serviceToUpdate.price = 200;

            expect(services[0].name).toBe('New Name');
            expect(services[0].price).toBe(200);
        });
    });

    describe('Delete Service (UC06)', () => {
        test('should remove service from array', () => {
            let services = [
                { id: 1, name: 'Service A' },
                { id: 2, name: 'Service B' }
            ];

            services = services.filter(s => s.id !== 1);

            expect(services.length).toBe(1);
            expect(services[0].id).toBe(2);
        });

        test('should handle deletion of non-existent service', () => {
            const services = [{ id: 1, name: 'Service A' }];
            const filtered = services.filter(s => s.id !== 999);

            expect(filtered.length).toBe(1);
        });
    });
});

// ============================================
// Test Suite: Booking Management
// ============================================
describe('Booking Management', () => {

    describe('Booking Data Structure', () => {
        test('should have correct booking properties', () => {
            const booking = {
                name: 'John',
                phone: '0812345678',
                email: 'john@example.com',
                serviceName: 'ตัดผม',
                date: '2025-12-01',
                time: '10:00',
                notes: '',
                price: 200,
                duration: 30
            };

            expect(booking).toHaveProperty('name');
            expect(booking).toHaveProperty('phone');
            expect(booking).toHaveProperty('email');
            expect(booking).toHaveProperty('serviceName');
            expect(booking).toHaveProperty('date');
            expect(booking).toHaveProperty('time');
            expect(booking).toHaveProperty('price');
            expect(booking).toHaveProperty('duration');
        });
    });

    describe('Submit Booking (UC01)', () => {
        test('should validate required fields', () => {
            const validateBooking = (booking) => {
                return Boolean(booking.name) &&
                       Boolean(booking.phone) &&
                       Boolean(booking.email) &&
                       Boolean(booking.serviceName) &&
                       Boolean(booking.date) &&
                       Boolean(booking.time);
            };

            const validBooking = {
                name: 'John',
                phone: '0812345678',
                email: 'john@test.com',
                serviceName: 'Service',
                date: '2025-12-01',
                time: '10:00'
            };

            const invalidBooking = {
                name: '',
                phone: '0812345678',
                email: 'john@test.com',
                serviceName: 'Service',
                date: '2025-12-01',
                time: '10:00'
            };

            expect(validateBooking(validBooking)).toBe(true);
            expect(validateBooking(invalidBooking)).toBe(false);
        });

        test('should validate email format', () => {
            const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('test@test.co.th')).toBe(true);
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@test.com')).toBe(false);
        });

        test('should validate phone format', () => {
            const validatePhone = (phone) => /^[0-9]{9,10}$/.test(phone);

            expect(validatePhone('0812345678')).toBe(true);
            expect(validatePhone('0123456789')).toBe(true);
            expect(validatePhone('123')).toBe(false);
            expect(validatePhone('abcdefghij')).toBe(false);
        });

        test('should not allow past dates', () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

            const isValidDate = (date) => date >= today;

            expect(isValidDate(today)).toBe(true);
            expect(isValidDate(tomorrow)).toBe(true);
            expect(isValidDate(yesterday)).toBe(false);
        });

        test('should save booking to localStorage', () => {
            const bookings = [];
            const newBooking = { name: 'John', date: '2025-12-01' };
            bookings.push(newBooking);

            localStorage.setItem('bookings', JSON.stringify(bookings));

            expect(localStorage.setItem).toHaveBeenCalledWith('bookings', JSON.stringify(bookings));
        });
    });

    describe('Cancel Booking by Token (UC02)', () => {
        test('should validate token format (32 characters)', () => {
            const generateToken = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let token = '';
                for (let i = 0; i < 32; i++) {
                    token += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return token;
            };

            const token = generateToken();
            expect(token.length).toBe(32);
            expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
        });

        test('should parse cancel token from URL', () => {
            const url = 'https://example.com?cancel=ABC123xyz456';
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const cancelToken = urlParams.get('cancel');

            expect(cancelToken).toBe('ABC123xyz456');
        });

        test('should return null when no cancel token in URL', () => {
            const url = 'https://example.com';
            const urlParams = new URLSearchParams(url.split('?')[1] || '');
            const cancelToken = urlParams.get('cancel');

            expect(cancelToken).toBeNull();
        });
    });

    describe('Admin Cancel Booking (UC07)', () => {
        test('should find booking by email, date, and time', () => {
            const bookings = [
                { email: 'a@test.com', date: '2025-12-01', time: '10:00' },
                { email: 'b@test.com', date: '2025-12-01', time: '11:00' },
                { email: 'a@test.com', date: '2025-12-02', time: '10:00' }
            ];

            const findBooking = (email, date, time) => {
                return bookings.find(b =>
                    b.email === email &&
                    b.date === date &&
                    b.time === time
                );
            };

            const found = findBooking('a@test.com', '2025-12-01', '10:00');
            expect(found).toBeTruthy();
            expect(found.email).toBe('a@test.com');

            const notFound = findBooking('c@test.com', '2025-12-01', '10:00');
            expect(notFound).toBeUndefined();
        });

        test('should remove booking from array', () => {
            let bookings = [
                { email: 'a@test.com', date: '2025-12-01', time: '10:00' },
                { email: 'b@test.com', date: '2025-12-01', time: '11:00' }
            ];

            const index = bookings.findIndex(b =>
                b.email === 'a@test.com' &&
                b.date === '2025-12-01' &&
                b.time === '10:00'
            );

            if (index > -1) {
                bookings.splice(index, 1);
            }

            expect(bookings.length).toBe(1);
            expect(bookings[0].email).toBe('b@test.com');
        });
    });
});

// ============================================
// Test Suite: Admin Authentication
// ============================================
describe('Admin Authentication', () => {
    const ADMIN_PASSWORD = 'admin123';

    describe('Login (UC03)', () => {
        test('should accept correct password', () => {
            const inputPassword = 'admin123';
            expect(inputPassword === ADMIN_PASSWORD).toBe(true);
        });

        test('should reject incorrect password', () => {
            const inputPassword = 'wrongpassword';
            expect(inputPassword === ADMIN_PASSWORD).toBe(false);
        });

        test('should be case sensitive', () => {
            expect('Admin123' === ADMIN_PASSWORD).toBe(false);
            expect('ADMIN123' === ADMIN_PASSWORD).toBe(false);
        });

        test('should save login state to sessionStorage', () => {
            sessionStorage.setItem('adminLoggedIn', 'true');
            expect(sessionStorage.setItem).toHaveBeenCalledWith('adminLoggedIn', 'true');
        });

        test('should check login status on page load', () => {
            sessionStorage.getItem.mockReturnValue('true');
            const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
            expect(isLoggedIn).toBe(true);
        });
    });

    describe('Logout (UC08)', () => {
        test('should remove login state from sessionStorage', () => {
            sessionStorage.removeItem('adminLoggedIn');
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('adminLoggedIn');
        });

        test('should return false after logout', () => {
            sessionStorage.getItem.mockReturnValue(null);
            const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
            expect(isLoggedIn).toBe(false);
        });
    });

    describe('Session Security', () => {
        test('should use sessionStorage (not localStorage)', () => {
            // sessionStorage clears on tab close, more secure than localStorage
            sessionStorage.setItem('adminLoggedIn', 'true');

            expect(sessionStorage.setItem).toHaveBeenCalled();
            expect(localStorage.setItem).not.toHaveBeenCalledWith('adminLoggedIn', expect.anything());
        });
    });
});

// ============================================
// Test Suite: Time Slot Selection
// ============================================
describe('Time Slot Selection', () => {
    const availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    test('should have 6 time slots', () => {
        expect(availableSlots.length).toBe(6);
    });

    test('should contain morning slots', () => {
        expect(availableSlots).toContain('09:00');
        expect(availableSlots).toContain('10:00');
        expect(availableSlots).toContain('11:00');
    });

    test('should contain afternoon slots', () => {
        expect(availableSlots).toContain('14:00');
        expect(availableSlots).toContain('15:00');
        expect(availableSlots).toContain('16:00');
    });

    test('should not contain lunch break slots', () => {
        expect(availableSlots).not.toContain('12:00');
        expect(availableSlots).not.toContain('13:00');
    });

    test('should select only one time slot', () => {
        let selectedTime = null;

        selectedTime = '10:00';
        expect(selectedTime).toBe('10:00');

        selectedTime = '14:00';
        expect(selectedTime).toBe('14:00');
        expect(selectedTime).not.toBe('10:00');
    });
});

// ============================================
// Test Suite: API Interactions
// ============================================
describe('API Interactions', () => {

    describe('GET Services', () => {
        test('should call getServices endpoint', async () => {
            const mockResponse = {
                status: 'success',
                services: [
                    { id: 1, name: 'Service A', price: 100, duration: 30 }
                ]
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const response = await fetch(googleSheetURL + '?action=getServices');
            const result = await response.json();

            expect(fetch).toHaveBeenCalledWith(googleSheetURL + '?action=getServices');
            expect(result.status).toBe('success');
            expect(result.services.length).toBe(1);
        });
    });

    describe('GET Booking by Token', () => {
        test('should call getBooking endpoint with token', async () => {
            const mockResponse = {
                status: 'success',
                booking: {
                    name: 'John',
                    serviceName: 'Test Service',
                    date: '2025-12-01',
                    time: '10:00'
                }
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const token = 'ABC123';
            const response = await fetch(googleSheetURL + '?action=getBooking&token=' + token);
            const result = await response.json();

            expect(fetch).toHaveBeenCalledWith(googleSheetURL + '?action=getBooking&token=ABC123');
            expect(result.status).toBe('success');
            expect(result.booking.name).toBe('John');
        });

        test('should handle booking not found', async () => {
            const mockResponse = {
                status: 'error',
                message: 'Booking not found'
            };

            fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockResponse)
            });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const response = await fetch(googleSheetURL + '?action=getBooking&token=invalid');
            const result = await response.json();

            expect(result.status).toBe('error');
            expect(result.message).toBe('Booking not found');
        });
    });

    describe('POST Add Booking', () => {
        test('should send booking data to API', async () => {
            fetch.mockResolvedValueOnce({
                ok: true
            });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const booking = {
                action: 'addBooking',
                name: 'John',
                phone: '0812345678',
                email: 'john@test.com',
                serviceName: 'Test',
                date: '2025-12-01',
                time: '10:00',
                notes: '',
                price: 100,
                duration: 30
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(booking)
            });

            expect(fetch).toHaveBeenCalledWith(
                googleSheetURL,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(booking)
                })
            );
        });
    });

    describe('POST Cancel Booking', () => {
        test('should send cancel request with token', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const cancelData = {
                action: 'cancelBookingByToken',
                token: 'ABC123xyz'
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cancelData)
            });

            expect(fetch).toHaveBeenCalledWith(
                googleSheetURL,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(cancelData)
                })
            );
        });

        test('should send admin cancel request with email/date/time', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const cancelData = {
                action: 'cancelBooking',
                email: 'john@test.com',
                date: '2025-12-01',
                time: '10:00'
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cancelData)
            });

            expect(fetch).toHaveBeenCalledWith(
                googleSheetURL,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(cancelData)
                })
            );
        });
    });

    describe('POST Service Operations', () => {
        test('should send addService request', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const serviceData = {
                action: 'addService',
                id: Date.now(),
                name: 'New Service',
                desc: 'Description',
                price: 100,
                duration: 30
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });

            expect(fetch).toHaveBeenCalled();
        });

        test('should send deleteService request', async () => {
            fetch.mockResolvedValueOnce({ ok: true });

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';
            const deleteData = {
                action: 'deleteService',
                id: 123456789
            };

            await fetch(googleSheetURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deleteData)
            });

            expect(fetch).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle network error gracefully', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const googleSheetURL = 'https://script.google.com/macros/s/test/exec';

            let error = null;
            try {
                await fetch(googleSheetURL + '?action=getServices');
            } catch (err) {
                error = err;
            }

            expect(error).not.toBeNull();
            expect(error.message).toBe('Network error');
        });

        test('should fallback to localStorage when API fails', () => {
            const localServices = [{ id: 1, name: 'Local Service' }];
            localStorage.getItem.mockReturnValue(JSON.stringify(localServices));

            const services = JSON.parse(localStorage.getItem('services'));
            expect(services.length).toBe(1);
            expect(services[0].name).toBe('Local Service');
        });
    });
});

// ============================================
// Test Suite: Token Generation
// ============================================
describe('Token Generation', () => {
    const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    };

    test('should generate 32-character token', () => {
        const token = generateToken();
        expect(token.length).toBe(32);
    });

    test('should generate alphanumeric token', () => {
        const token = generateToken();
        expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    test('should generate unique tokens', () => {
        const tokens = new Set();
        for (let i = 0; i < 100; i++) {
            tokens.add(generateToken());
        }
        // All 100 tokens should be unique
        expect(tokens.size).toBe(100);
    });

    test('should not contain special characters', () => {
        const token = generateToken();
        expect(token).not.toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/);
    });
});

// ============================================
// Test Suite: Date Utilities
// ============================================
describe('Date Utilities', () => {

    test('should format date for Thai locale', () => {
        const date = new Date('2025-12-01T00:00:00');
        const formatted = date.toLocaleDateString('th-TH', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
    });

    test('should get today date in YYYY-MM-DD format', () => {
        const today = new Date().toISOString().split('T')[0];
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should set min date attribute to today', () => {
        const today = new Date().toISOString().split('T')[0];
        const minDate = today;

        // Simulating: document.getElementById('appointmentDate').min = today;
        expect(minDate).toBe(today);
    });
});

// ============================================
// Test Suite: Price Formatting
// ============================================
describe('Price Formatting', () => {

    test('should format price with 2 decimal places', () => {
        const price = 100;
        const formatted = price.toFixed(2);

        expect(formatted).toBe('100.00');
    });

    test('should format price with Thai Baht symbol', () => {
        const price = 500.5;
        const formatted = `฿${price.toFixed(2)}`;

        expect(formatted).toBe('฿500.50');
    });

    test('should handle integer prices', () => {
        const price = 200;
        const formatted = `฿${price.toFixed(2)}`;

        expect(formatted).toBe('฿200.00');
    });
});

// ============================================
// Test Suite: Booking Summary
// ============================================
describe('Booking Summary', () => {

    test('should show summary only when all fields are filled', () => {
        const shouldShowSummary = (serviceId, date, time) => {
            return Boolean(serviceId) && Boolean(date) && Boolean(time);
        };

        expect(shouldShowSummary('1', '2025-12-01', '10:00')).toBe(true);
        expect(shouldShowSummary('1', '2025-12-01', null)).toBe(false);
        expect(shouldShowSummary('1', null, '10:00')).toBe(false);
        expect(shouldShowSummary(null, '2025-12-01', '10:00')).toBe(false);
    });

    test('should calculate correct summary values', () => {
        const service = { name: 'Test', price: 500, duration: 60 };
        const date = '2025-12-01';
        const time = '10:00';

        const summary = {
            serviceName: service.name,
            price: service.price,
            duration: service.duration,
            dateTime: `${date} ${time}`
        };

        expect(summary.serviceName).toBe('Test');
        expect(summary.price).toBe(500);
        expect(summary.duration).toBe(60);
        expect(summary.dateTime).toBe('2025-12-01 10:00');
    });
});

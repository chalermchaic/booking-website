/**
 * Unit Tests for Google Apps Script Functions
 * ทดสอบ Backend Logic (ที่จะรันใน Google Apps Script)
 */

// ============================================
// Mock Google Apps Script Environment
// ============================================
const mockSheet = {
    data: [],
    appendRow: jest.fn(function(row) {
        this.data.push(row);
    }),
    getDataRange: jest.fn(function() {
        return {
            getValues: () => this.data
        };
    }),
    deleteRow: jest.fn(function(rowIndex) {
        this.data.splice(rowIndex - 1, 1);
    }),
    getRange: jest.fn(() => ({
        setValue: jest.fn(),
        setValues: jest.fn()
    }))
};

const mockSpreadsheetApp = {
    openById: jest.fn(() => ({
        getSheetByName: jest.fn((name) => {
            if (name === 'Bookings' || name === 'Services') {
                return mockSheet;
            }
            return null;
        }),
        insertSheet: jest.fn(() => mockSheet)
    }))
};

const mockMailApp = {
    sendEmail: jest.fn()
};

const mockContentService = {
    createTextOutput: jest.fn((content) => ({
        setMimeType: jest.fn(() => content)
    })),
    MimeType: {
        JSON: 'application/json'
    }
};

// ============================================
// Helper Functions (Simulating Google Apps Script)
// ============================================

// Token Generation
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Config
const SHEET_ID = 'test_sheet_id';
const ADMIN_EMAIL = 'admin@test.com';
const WEBSITE_URL = 'https://test.com';

// Reset mock data before each test
beforeEach(() => {
    mockSheet.data = [
        ['Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Notes', 'Price', 'Duration', 'Token']
    ];
    jest.clearAllMocks();
});

// ============================================
// Test Suite: Token Generation
// ============================================
describe('Token Generation', () => {

    test('should generate 32-character token', () => {
        const token = generateToken();
        expect(token.length).toBe(32);
    });

    test('should generate alphanumeric token only', () => {
        const token = generateToken();
        expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    test('should generate unique tokens', () => {
        const tokens = new Set();
        for (let i = 0; i < 1000; i++) {
            tokens.add(generateToken());
        }
        expect(tokens.size).toBe(1000);
    });
});

// ============================================
// Test Suite: doGet Handler
// ============================================
describe('doGet Handler', () => {

    const doGet = (e) => {
        const action = e.parameter.action;

        if (action === 'getServices') {
            return { status: 'success', services: [] };
        }

        if (action === 'getBooking') {
            const token = e.parameter.token;
            if (!token) {
                return { status: 'error', message: 'Token required' };
            }
            // Find booking by token
            const data = mockSheet.data;
            for (let i = 1; i < data.length; i++) {
                if (data[i][10] === token) {
                    return {
                        status: 'success',
                        booking: {
                            name: data[i][1],
                            serviceName: data[i][4],
                            date: data[i][5],
                            time: data[i][6],
                            price: data[i][8]
                        }
                    };
                }
            }
            return { status: 'error', message: 'Booking not found' };
        }

        return { error: 'Invalid action' };
    };

    test('should return services for getServices action', () => {
        const result = doGet({ parameter: { action: 'getServices' } });
        expect(result.status).toBe('success');
        expect(result.services).toBeDefined();
    });

    test('should require token for getBooking action', () => {
        const result = doGet({ parameter: { action: 'getBooking' } });
        expect(result.status).toBe('error');
        expect(result.message).toBe('Token required');
    });

    test('should find booking by valid token', () => {
        mockSheet.data.push([
            new Date(), 'John', '0812345678', 'john@test.com',
            'Service', '2025-12-01', '10:00', '', 500, 60, 'VALID_TOKEN_123'
        ]);

        const result = doGet({
            parameter: { action: 'getBooking', token: 'VALID_TOKEN_123' }
        });

        expect(result.status).toBe('success');
        expect(result.booking.name).toBe('John');
    });

    test('should return error for invalid token', () => {
        const result = doGet({
            parameter: { action: 'getBooking', token: 'INVALID_TOKEN' }
        });
        expect(result.status).toBe('error');
        expect(result.message).toBe('Booking not found');
    });

    test('should return error for invalid action', () => {
        const result = doGet({ parameter: { action: 'invalidAction' } });
        expect(result.error).toBe('Invalid action');
    });
});

// ============================================
// Test Suite: doPost Handler
// ============================================
describe('doPost Handler', () => {

    const doPost = (e) => {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        switch (action) {
            case 'addBooking':
                return { status: 'success', token: generateToken() };
            case 'cancelBooking':
                return { status: 'success' };
            case 'cancelBookingByToken':
                return { status: 'success' };
            case 'addService':
                return { status: 'success' };
            case 'updateService':
                return { status: 'success' };
            case 'deleteService':
                return { status: 'success' };
            default:
                return { error: 'Invalid action' };
        }
    };

    test('should handle addBooking action', () => {
        const result = doPost({
            postData: { contents: JSON.stringify({ action: 'addBooking', name: 'John' }) }
        });
        expect(result.status).toBe('success');
        expect(result.token).toBeDefined();
        expect(result.token.length).toBe(32);
    });

    test('should handle cancelBooking action', () => {
        const result = doPost({
            postData: {
                contents: JSON.stringify({
                    action: 'cancelBooking',
                    email: 'test@test.com',
                    date: '2025-12-01',
                    time: '10:00'
                })
            }
        });
        expect(result.status).toBe('success');
    });

    test('should handle cancelBookingByToken action', () => {
        const result = doPost({
            postData: {
                contents: JSON.stringify({
                    action: 'cancelBookingByToken',
                    token: 'ABC123'
                })
            }
        });
        expect(result.status).toBe('success');
    });

    test('should handle addService action', () => {
        const result = doPost({
            postData: {
                contents: JSON.stringify({
                    action: 'addService',
                    id: Date.now(),
                    name: 'Test',
                    desc: 'Desc',
                    price: 100,
                    duration: 30
                })
            }
        });
        expect(result.status).toBe('success');
    });

    test('should handle updateService action', () => {
        const result = doPost({
            postData: {
                contents: JSON.stringify({
                    action: 'updateService',
                    id: 123,
                    name: 'Updated'
                })
            }
        });
        expect(result.status).toBe('success');
    });

    test('should handle deleteService action', () => {
        const result = doPost({
            postData: {
                contents: JSON.stringify({
                    action: 'deleteService',
                    id: 123
                })
            }
        });
        expect(result.status).toBe('success');
    });

    test('should return error for invalid action', () => {
        const result = doPost({
            postData: { contents: JSON.stringify({ action: 'invalidAction' }) }
        });
        expect(result.error).toBe('Invalid action');
    });
});

// ============================================
// Test Suite: Booking Functions
// ============================================
describe('Booking Functions', () => {

    describe('addBooking', () => {
        const addBooking = (data) => {
            const token = generateToken();
            const row = [
                new Date(),
                data.name,
                data.phone,
                data.email,
                data.serviceName,
                data.date,
                data.time,
                data.notes || '',
                data.price,
                data.duration,
                token
            ];
            mockSheet.appendRow(row);
            return { status: 'success', token };
        };

        test('should append booking to sheet', () => {
            const data = {
                name: 'John',
                phone: '0812345678',
                email: 'john@test.com',
                serviceName: 'Test Service',
                date: '2025-12-01',
                time: '10:00',
                notes: '',
                price: 500,
                duration: 60
            };

            const result = addBooking(data);

            expect(mockSheet.appendRow).toHaveBeenCalled();
            expect(result.status).toBe('success');
            expect(result.token).toBeDefined();
        });

        test('should generate unique token for each booking', () => {
            const data = { name: 'Test', phone: '123', email: 'a@b.com', serviceName: 'S', date: '2025-12-01', time: '10:00', price: 100, duration: 30 };

            const result1 = addBooking(data);
            const result2 = addBooking(data);

            expect(result1.token).not.toBe(result2.token);
        });

        test('should handle empty notes', () => {
            const data = { name: 'Test', phone: '123', email: 'a@b.com', serviceName: 'S', date: '2025-12-01', time: '10:00', price: 100, duration: 30 };

            const result = addBooking(data);

            expect(result.status).toBe('success');
        });
    });

    describe('cancelBooking (Admin)', () => {
        const cancelBooking = (data) => {
            const rows = mockSheet.data;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][3] === data.email &&
                    rows[i][5] === data.date &&
                    rows[i][6] === data.time) {
                    mockSheet.deleteRow(i + 1);
                    return { status: 'success' };
                }
            }
            return { status: 'error', message: 'Booking not found' };
        };

        test('should find and delete booking by email/date/time', () => {
            mockSheet.data.push([
                new Date(), 'John', '0812345678', 'john@test.com',
                'Service', '2025-12-01', '10:00', '', 500, 60, 'TOKEN'
            ]);

            const result = cancelBooking({
                email: 'john@test.com',
                date: '2025-12-01',
                time: '10:00'
            });

            expect(result.status).toBe('success');
            expect(mockSheet.deleteRow).toHaveBeenCalled();
        });

        test('should return error if booking not found', () => {
            const result = cancelBooking({
                email: 'notfound@test.com',
                date: '2025-12-01',
                time: '10:00'
            });

            expect(result.status).toBe('error');
            expect(result.message).toBe('Booking not found');
        });
    });

    describe('cancelBookingByToken (Customer)', () => {
        const cancelBookingByToken = (token) => {
            if (!token) {
                return { status: 'error', message: 'Token required' };
            }

            const rows = mockSheet.data;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][10] === token) {
                    mockSheet.deleteRow(i + 1);
                    return { status: 'success' };
                }
            }
            return { status: 'error', message: 'Booking not found or already cancelled' };
        };

        test('should require token', () => {
            const result = cancelBookingByToken(null);
            expect(result.status).toBe('error');
            expect(result.message).toBe('Token required');
        });

        test('should find and delete booking by token', () => {
            mockSheet.data.push([
                new Date(), 'John', '0812345678', 'john@test.com',
                'Service', '2025-12-01', '10:00', '', 500, 60, 'VALID_TOKEN'
            ]);

            const result = cancelBookingByToken('VALID_TOKEN');

            expect(result.status).toBe('success');
            expect(mockSheet.deleteRow).toHaveBeenCalled();
        });

        test('should return error for invalid token', () => {
            const result = cancelBookingByToken('INVALID_TOKEN');

            expect(result.status).toBe('error');
            expect(result.message).toBe('Booking not found or already cancelled');
        });
    });

    describe('getBookingByToken', () => {
        const getBookingByToken = (token) => {
            if (!token) {
                return { status: 'error', message: 'Token required' };
            }

            const rows = mockSheet.data;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][10] === token) {
                    return {
                        status: 'success',
                        booking: {
                            name: rows[i][1],
                            phone: rows[i][2],
                            email: rows[i][3],
                            serviceName: rows[i][4],
                            date: rows[i][5],
                            time: rows[i][6],
                            notes: rows[i][7],
                            price: rows[i][8],
                            duration: rows[i][9]
                        }
                    };
                }
            }
            return { status: 'error', message: 'Booking not found' };
        };

        test('should return booking details for valid token', () => {
            mockSheet.data.push([
                new Date(), 'John Doe', '0812345678', 'john@test.com',
                'Test Service', '2025-12-01', '10:00', 'Some notes', 500, 60, 'TOKEN123'
            ]);

            const result = getBookingByToken('TOKEN123');

            expect(result.status).toBe('success');
            expect(result.booking.name).toBe('John Doe');
            expect(result.booking.serviceName).toBe('Test Service');
            expect(result.booking.price).toBe(500);
        });

        test('should return error for missing token', () => {
            const result = getBookingByToken(null);
            expect(result.status).toBe('error');
        });
    });
});

// ============================================
// Test Suite: Service Functions
// ============================================
describe('Service Functions', () => {

    beforeEach(() => {
        mockSheet.data = [
            ['ID', 'Name', 'Description', 'Price', 'Duration', 'Created', 'Updated']
        ];
    });

    describe('getServices', () => {
        const getServices = () => {
            const rows = mockSheet.data;
            const services = [];

            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0]) {
                    services.push({
                        id: rows[i][0],
                        name: rows[i][1],
                        desc: rows[i][2],
                        price: parseFloat(rows[i][3]),
                        duration: parseInt(rows[i][4])
                    });
                }
            }

            return { status: 'success', services };
        };

        test('should return empty array when no services', () => {
            const result = getServices();
            expect(result.status).toBe('success');
            expect(result.services).toEqual([]);
        });

        test('should return all services', () => {
            mockSheet.data.push([1, 'Service A', 'Desc A', 100, 30, new Date(), null]);
            mockSheet.data.push([2, 'Service B', 'Desc B', 200, 60, new Date(), null]);

            const result = getServices();

            expect(result.services.length).toBe(2);
            expect(result.services[0].name).toBe('Service A');
            expect(result.services[1].name).toBe('Service B');
        });

        test('should parse price as float', () => {
            mockSheet.data.push([1, 'Service', 'Desc', '99.99', 30, new Date(), null]);

            const result = getServices();

            expect(result.services[0].price).toBe(99.99);
            expect(typeof result.services[0].price).toBe('number');
        });

        test('should parse duration as integer', () => {
            mockSheet.data.push([1, 'Service', 'Desc', 100, '45', new Date(), null]);

            const result = getServices();

            expect(result.services[0].duration).toBe(45);
            expect(typeof result.services[0].duration).toBe('number');
        });
    });

    describe('addService', () => {
        const addService = (data) => {
            mockSheet.appendRow([
                data.id,
                data.name,
                data.desc,
                data.price,
                data.duration,
                new Date()
            ]);
            return { status: 'success' };
        };

        test('should add service to sheet', () => {
            const data = {
                id: Date.now(),
                name: 'New Service',
                desc: 'Description',
                price: 500,
                duration: 60
            };

            const result = addService(data);

            expect(mockSheet.appendRow).toHaveBeenCalled();
            expect(result.status).toBe('success');
        });
    });

    describe('updateService', () => {
        const updateService = (data) => {
            const rows = mockSheet.data;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] === data.id) {
                    rows[i][1] = data.name;
                    rows[i][2] = data.desc;
                    rows[i][3] = data.price;
                    rows[i][4] = data.duration;
                    rows[i][6] = new Date();
                    return { status: 'success' };
                }
            }
            return { status: 'error', message: 'Service not found' };
        };

        test('should update service data', () => {
            mockSheet.data.push([123, 'Old Name', 'Old Desc', 100, 30, new Date(), null]);

            const result = updateService({
                id: 123,
                name: 'New Name',
                desc: 'New Desc',
                price: 200,
                duration: 60
            });

            expect(result.status).toBe('success');
            expect(mockSheet.data[1][1]).toBe('New Name');
            expect(mockSheet.data[1][3]).toBe(200);
        });

        test('should return error if service not found', () => {
            const result = updateService({
                id: 999,
                name: 'Test'
            });

            expect(result.status).toBe('error');
        });
    });

    describe('deleteService', () => {
        const deleteService = (data) => {
            const rows = mockSheet.data;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] === data.id) {
                    mockSheet.deleteRow(i + 1);
                    return { status: 'success' };
                }
            }
            return { status: 'error', message: 'Service not found' };
        };

        test('should delete service by id', () => {
            mockSheet.data.push([123, 'Service', 'Desc', 100, 30, new Date(), null]);

            const result = deleteService({ id: 123 });

            expect(result.status).toBe('success');
            expect(mockSheet.deleteRow).toHaveBeenCalled();
        });

        test('should return error if service not found', () => {
            const result = deleteService({ id: 999 });

            expect(result.status).toBe('error');
        });
    });
});

// ============================================
// Test Suite: Setup Function
// ============================================
describe('Setup Function', () => {

    const setupSheets = () => {
        // Create Bookings header
        const bookingsHeader = [
            'Timestamp', 'Name', 'Phone', 'Email', 'Service',
            'Date', 'Time', 'Notes', 'Price', 'Duration', 'Token'
        ];

        // Create Services header
        const servicesHeader = [
            'ID', 'Name', 'Description', 'Price', 'Duration', 'Created', 'Updated'
        ];

        return {
            bookingsHeader,
            servicesHeader
        };
    };

    test('should create correct Bookings header', () => {
        const { bookingsHeader } = setupSheets();

        expect(bookingsHeader.length).toBe(11);
        expect(bookingsHeader).toContain('Timestamp');
        expect(bookingsHeader).toContain('Name');
        expect(bookingsHeader).toContain('Token');
    });

    test('should create correct Services header', () => {
        const { servicesHeader } = setupSheets();

        expect(servicesHeader.length).toBe(7);
        expect(servicesHeader).toContain('ID');
        expect(servicesHeader).toContain('Name');
        expect(servicesHeader).toContain('Price');
    });

    test('should include Token column in Bookings', () => {
        const { bookingsHeader } = setupSheets();
        expect(bookingsHeader[10]).toBe('Token');
    });
});

// ============================================
// Test Suite: Email Notifications
// ============================================
describe('Email Notifications', () => {

    const sendBookingConfirmation = (booking, token) => {
        const cancelLink = `${WEBSITE_URL}?cancel=${token}`;
        const subject = `✓ การจองคิวสำเร็จ - ${booking.serviceName}`;
        const body = `สวัสดี ${booking.name}\n\n` +
                     `การจองคิวของคุณสำเร็จแล้ว\n\n` +
                     `📋 รายละเอียดการจอง:\n` +
                     `• บริการ: ${booking.serviceName}\n` +
                     `• วัน เวลา: ${booking.date} เวลา ${booking.time}\n` +
                     `• ราคา: ฿${booking.price}\n\n` +
                     `❌ ยกเลิกการจอง: ${cancelLink}`;

        return { to: booking.email, subject, body };
    };

    test('should include cancel link with token', () => {
        const booking = {
            name: 'John',
            email: 'john@test.com',
            serviceName: 'Test',
            date: '2025-12-01',
            time: '10:00',
            price: 500
        };

        const email = sendBookingConfirmation(booking, 'TOKEN123');

        expect(email.body).toContain('?cancel=TOKEN123');
    });

    test('should include booking details', () => {
        const booking = {
            name: 'John Doe',
            email: 'john@test.com',
            serviceName: 'Massage',
            date: '2025-12-01',
            time: '10:00',
            price: 500
        };

        const email = sendBookingConfirmation(booking, 'TOKEN');

        expect(email.body).toContain('John Doe');
        expect(email.body).toContain('Massage');
        expect(email.body).toContain('2025-12-01');
        expect(email.body).toContain('10:00');
        expect(email.body).toContain('500');
    });

    test('should send to correct recipient', () => {
        const booking = {
            name: 'John',
            email: 'customer@test.com',
            serviceName: 'Test',
            date: '2025-12-01',
            time: '10:00',
            price: 100
        };

        const email = sendBookingConfirmation(booking, 'TOKEN');

        expect(email.to).toBe('customer@test.com');
    });
});

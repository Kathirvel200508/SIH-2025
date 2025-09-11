"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../notifications.service");
let ReportsService = class ReportsService {
    notifications;
    constructor(notifications) {
        this.notifications = notifications;
        this.seedSampleData(50);
    }
    reports = [];
    create(report) {
        const newReport = {
            ...report,
            id: (this.reports.length + 1).toString(),
            createdAt: new Date().toISOString(),
            status: 'in_progress',
        };
        this.reports.unshift(newReport);
        return newReport;
    }
    list(filters) {
        let out = this.reports;
        if (filters?.category) {
            out = out.filter((r) => r.category === filters.category);
        }
        if (filters?.locationQuery) {
            const q = filters.locationQuery.toLowerCase();
            out = out.filter((r) => (r.locationName || '').toLowerCase().includes(q));
        }
        return out;
    }
    listByUser(userId) {
        return this.reports.filter((r) => r.createdByUserId === userId);
    }
    update(id, update) {
        const idx = this.reports.findIndex((r) => r.id === id);
        if (idx === -1)
            return undefined;
        const current = this.reports[idx];
        const next = { ...current, ...update };
        this.reports[idx] = next;
        if (update.status === 'finished') {
            this.notifications.addNotification(current.createdByUserId, `Your report "${current.title}" has been marked as finished.`);
        }
        return next;
    }
    seedSampleData(count) {
        if (this.reports.length > 0)
            return;
        const categories = ['sewage', 'electricity', 'waste', 'roads', 'transport', 'other'];
        const priorities = ['low', 'medium', 'high'];
        const statuses = ['in_progress', 'accepted', 'rejected', 'finished'];
        const cities = [
            { city: 'Chennai', center: { lat: 13.0827, lng: 80.2707 }, wards: ['T. Nagar', 'Velachery', 'Adyar', 'Anna Nagar', 'Mylapore'] },
            { city: 'Bengaluru', center: { lat: 12.9716, lng: 77.5946 }, wards: ['Whitefield', 'Koramangala', 'Indiranagar', 'Jayanagar', 'Yelahanka'] },
            { city: 'Hyderabad', center: { lat: 17.3850, lng: 78.4867 }, wards: ['Hitech City', 'Madhapur', 'Banjara Hills', 'Secunderabad', 'Kukatpally'] },
            { city: 'Mumbai', center: { lat: 19.0760, lng: 72.8777 }, wards: ['Andheri', 'Bandra', 'Dadar', 'Borivali', 'Powai'] },
            { city: 'Delhi', center: { lat: 28.6139, lng: 77.2090 }, wards: ['Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Lajpat Nagar'] },
            { city: 'Thiruvallur', center: { lat: 13.139, lng: 79.908 }, wards: ['Tiruvallur', 'Poonamallee', 'Avadi', 'Tiruverkadu', 'Pattabiram'] },
            { city: 'Kochi', center: { lat: 9.9312, lng: 76.2673 }, wards: ['Fort Kochi', 'Kadavanthra', 'Edapally', 'Vyttila', 'Kakkanad'] },
        ];
        const users = [
            { id: 'u001', name: 'Arun' },
            { id: 'u002', name: 'Priya' },
            { id: 'u003', name: 'Rahul' },
            { id: 'u004', name: 'Sneha' },
            { id: 'u005', name: 'Vikram' },
            { id: 'u006', name: 'Anita' },
            { id: 'u007', name: 'Kiran' },
            { id: 'u008', name: 'Meera' },
        ];
        function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function jitter(base, delta) { return base + (Math.random() - 0.5) * delta; }
        for (let i = 0; i < count; i++) {
            const city = rnd(cities);
            const ward = rnd(city.wards);
            const category = rnd(categories);
            const priority = rnd(priorities);
            const status = rnd(statuses);
            const user = rnd(users);
            const lat = jitter(city.center.lat, 0.18);
            const lng = jitter(city.center.lng, 0.24);
            const title = `${category.charAt(0).toUpperCase() + category.slice(1)} issue in ${ward}`;
            const description = `Reported ${category} issue affecting residents of ${ward}, ${city.city}.`;
            const locationName = `${ward}, ${city.city}`;
            const createdAt = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 14)).toISOString();
            const seeded = {
                id: (this.reports.length + 1).toString(),
                title,
                description,
                priority,
                status,
                category,
                createdAt,
                createdByUserId: user.id,
                createdByUsername: user.name,
                attachments: [],
                location: { lat, lng },
                locationName,
            };
            this.reports.unshift(seeded);
        }
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
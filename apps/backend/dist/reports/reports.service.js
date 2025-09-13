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
        this.seedSampleData(150);
    }
    reports = [];
    create(report) {
        const newReport = {
            ...report,
            id: (this.reports.length + 1).toString(),
            createdAt: new Date().toISOString(),
            status: 'in_progress',
            priority: 'low',
            priorityScore: 0,
            upvotes: 0,
            upvotedBy: [],
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
    upvote(id, userId) {
        const idx = this.reports.findIndex((r) => r.id === id);
        if (idx === -1)
            return undefined;
        const current = this.reports[idx];
        if (current.upvotedBy?.includes(userId)) {
            return current;
        }
        const newUpvotes = (current.upvotes || 0) + 1;
        const newUpvotedBy = [...(current.upvotedBy || []), userId];
        const newPriority = newUpvotes >= 6 ? 'high' : newUpvotes >= 3 ? 'medium' : 'low';
        const next = {
            ...current,
            upvotes: newUpvotes,
            upvotedBy: newUpvotedBy,
            priority: newPriority,
            priorityScore: newUpvotes
        };
        this.reports[idx] = next;
        return next;
    }
    listByArea(userLocation, radiusKm = 10) {
        console.log(`listByArea called with userLocation:`, userLocation, `total reports:`, this.reports.length);
        if (!userLocation) {
            const reportsWithLocation = this.reports.filter(report => report.location);
            console.log(`No user location, returning ${reportsWithLocation.length} reports with location data`);
            return reportsWithLocation;
        }
        const filteredReports = this.reports.filter(report => {
            if (!report.location)
                return false;
            const distance = this.calculateDistance(userLocation, report.location);
            return distance <= radiusKm;
        });
        console.log(`Filtered ${filteredReports.length} reports within ${radiusKm}km of user location`);
        return filteredReports;
    }
    calculateDistance(point1, point2) {
        const R = 6371;
        const dLat = this.deg2rad(point2.lat - point1.lat);
        const dLon = this.deg2rad(point2.lng - point1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    addTestReports() {
        const testReports = [
            {
                title: "Broken streetlight on Main Road",
                description: "Streetlight has been broken for 3 days, making the area unsafe at night",
                category: 'electricity',
                createdByUserId: 'test-user-1',
                createdByUsername: 'Test User 1',
                location: { lat: 13.0827, lng: 80.2707 },
                locationName: 'T. Nagar, Chennai',
            },
            {
                title: "Sewage overflow near bus stop",
                description: "Sewage is overflowing and causing bad smell in the area",
                category: 'sewage',
                createdByUserId: 'test-user-2',
                createdByUsername: 'Test User 2',
                location: { lat: 13.0827, lng: 80.2707 },
                locationName: 'Velachery, Chennai',
            },
            {
                title: "Pothole on highway",
                description: "Large pothole causing traffic issues and vehicle damage",
                category: 'roads',
                createdByUserId: 'test-user-3',
                createdByUsername: 'Test User 3',
                location: { lat: 12.9716, lng: 77.5946 },
                locationName: 'Koramangala, Bengaluru',
            },
            {
                title: "Garbage not collected",
                description: "Garbage has not been collected for a week, causing health issues",
                category: 'waste',
                createdByUserId: 'test-user-4',
                createdByUsername: 'Test User 4',
                location: { lat: 17.3850, lng: 78.4867 },
                locationName: 'Hitech City, Hyderabad',
            },
            {
                title: "Bus stop shelter damaged",
                description: "Bus stop shelter is damaged and needs repair",
                category: 'transport',
                createdByUserId: 'test-user-5',
                createdByUsername: 'Test User 5',
                location: { lat: 19.0760, lng: 72.8777 },
                locationName: 'Andheri, Mumbai',
            },
            {
                title: "Water logging on street",
                description: "Heavy rain caused water logging, making it difficult to walk",
                category: 'sewage',
                createdByUserId: 'test-user-6',
                createdByUsername: 'Test User 6',
                location: { lat: 28.6139, lng: 77.2090 },
                locationName: 'Dwarka, Delhi',
            },
            {
                title: "Power outage in area",
                description: "No electricity for the past 6 hours",
                category: 'electricity',
                createdByUserId: 'test-user-7',
                createdByUsername: 'Test User 7',
                location: { lat: 18.5204, lng: 73.8567 },
                locationName: 'Hinjewadi, Pune',
            }
        ];
        let addedCount = 0;
        console.log(`Adding ${testReports.length} test reports. Current total reports: ${this.reports.length}`);
        testReports.forEach(report => {
            const newReport = this.create({
                title: report.title,
                description: report.description,
                category: report.category,
                createdByUserId: report.createdByUserId,
                createdByUsername: report.createdByUsername,
                location: report.location,
                locationName: report.locationName,
            });
            console.log(`Created test report: ${newReport.title} at ${newReport.locationName}`);
            if (Math.random() > 0.5) {
                const upvotes = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < upvotes; i++) {
                    this.upvote(newReport.id, `test-upvoter-${i}`);
                }
            }
            addedCount++;
        });
        console.log(`Added ${addedCount} test reports. New total reports: ${this.reports.length}`);
        return addedCount;
    }
    priorityToBaseScore(p) {
        if (p === 'high')
            return 5;
        if (p === 'medium')
            return 2;
        return 0;
    }
    seedSampleData(count) {
        if (this.reports.length > 0)
            return;
        const categories = ['sewage', 'electricity', 'waste', 'roads', 'transport', 'other'];
        const priorities = ['low', 'medium', 'high'];
        const statuses = ['in_progress', 'accepted', 'rejected', 'finished'];
        const cities = [
            { city: 'Chennai', center: { lat: 13.0827, lng: 80.2707 }, wards: ['T. Nagar', 'Velachery', 'Adyar', 'Anna Nagar', 'Mylapore', 'Tambaram', 'Chromepet', 'Pallavaram'] },
            { city: 'Bengaluru', center: { lat: 12.9716, lng: 77.5946 }, wards: ['Whitefield', 'Koramangala', 'Indiranagar', 'Jayanagar', 'Yelahanka', 'Marathahalli', 'Electronic City', 'HSR Layout'] },
            { city: 'Hyderabad', center: { lat: 17.3850, lng: 78.4867 }, wards: ['Hitech City', 'Madhapur', 'Banjara Hills', 'Secunderabad', 'Kukatpally', 'Gachibowli', 'Kondapur', 'Begumpet'] },
            { city: 'Mumbai', center: { lat: 19.0760, lng: 72.8777 }, wards: ['Andheri', 'Bandra', 'Dadar', 'Borivali', 'Powai', 'Goregaon', 'Malad', 'Kandivali'] },
            { city: 'Delhi', center: { lat: 28.6139, lng: 77.2090 }, wards: ['Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Lajpat Nagar', 'Pitampura', 'Janakpuri', 'Vasant Kunj'] },
            { city: 'Thiruvallur', center: { lat: 13.139, lng: 79.908 }, wards: ['Tiruvallur', 'Poonamallee', 'Avadi', 'Tiruverkadu', 'Pattabiram', 'Ambattur', 'Red Hills', 'Manali'] },
            { city: 'Kochi', center: { lat: 9.9312, lng: 76.2673 }, wards: ['Fort Kochi', 'Kadavanthra', 'Edapally', 'Vyttila', 'Kakkanad', 'Aluva', 'Thripunithura', 'Palarivattom'] },
            { city: 'Pune', center: { lat: 18.5204, lng: 73.8567 }, wards: ['Hinjewadi', 'Koregaon Park', 'Baner', 'Aundh', 'Viman Nagar', 'Kharadi', 'Wakad', 'Pimpri'] },
            { city: 'Kolkata', center: { lat: 22.5726, lng: 88.3639 }, wards: ['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Gariahat', 'Behala', 'Tollygunge', 'Jadavpur'] },
            { city: 'Ahmedabad', center: { lat: 23.0225, lng: 72.5714 }, wards: ['Vastrapur', 'Bodakdev', 'Satellite', 'Maninagar', 'Naroda', 'Bapunagar', 'Chandkheda', 'Gota'] },
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
            { id: 'u009', name: 'Rajesh' },
            { id: 'u010', name: 'Kavitha' },
            { id: 'u011', name: 'Suresh' },
            { id: 'u012', name: 'Deepa' },
            { id: 'u013', name: 'Manoj' },
            { id: 'u014', name: 'Lakshmi' },
            { id: 'u015', name: 'Ganesh' },
            { id: 'u016', name: 'Pooja' },
            { id: 'u017', name: 'Ravi' },
            { id: 'u018', name: 'Sunita' },
            { id: 'u019', name: 'Kumar' },
            { id: 'u020', name: 'Radha' },
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
            const upvotes = Math.random() > 0.5 ? Math.floor(Math.random() * 12) : 0;
            const upvotedBy = upvotes > 0 ? users.slice(0, Math.min(upvotes, users.length)).map(u => u.id) : [];
            const calculatedPriority = upvotes >= 6 ? 'high' : upvotes >= 3 ? 'medium' : 'low';
            const seeded = {
                id: (this.reports.length + 1).toString(),
                title,
                description,
                priority: calculatedPriority,
                priorityScore: upvotes,
                upvotes,
                upvotedBy,
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
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

export type ReportPriority = 'low' | 'medium' | 'high';
export type ReportStatus = 'in_progress' | 'accepted' | 'rejected' | 'finished';
export type ReportCategory = 'sewage' | 'electricity' | 'waste' | 'roads' | 'transport' | 'other';

export interface Report {
  id: string;
  title: string;
  description: string;
  priority: ReportPriority;
  priorityScore?: number;
  upvotes?: number;
  upvotedBy?: string[]; // Array of user IDs who upvoted
  status: ReportStatus;
  category: ReportCategory;
  createdAt: string;
  createdByUserId: string;
  createdByUsername?: string;
  attachments?: string[]; // URLs of uploaded files
  location?: { lat: number; lng: number };
  locationName?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly notifications: NotificationsService) {
    // Seed sample data for admin viewing
    this.seedSampleData(150);
  }
  private reports: Report[] = [];

  create(report: Omit<Report, 'id' | 'createdAt' | 'status' | 'upvotes' | 'upvotedBy' | 'priority'>): Report {
    const newReport: Report = {
      ...report,
      id: (this.reports.length + 1).toString(),
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      priority: 'low', // All reports start as low priority
      priorityScore: 0, // Start with 0 score
      upvotes: 0,
      upvotedBy: [],
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  list(filters?: { category?: ReportCategory; locationQuery?: string }): Report[] {
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

  listByUser(userId: string): Report[] {
    return this.reports.filter((r) => r.createdByUserId === userId);
  }

  update(id: string, update: Partial<Pick<Report, 'status' | 'priority'>>): Report | undefined {
    const idx = this.reports.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const current = this.reports[idx];
    const next: Report = { ...current, ...update };
    this.reports[idx] = next;
    if (update.status === 'finished') {
      this.notifications.addNotification(current.createdByUserId, `Your report "${current.title}" has been marked as finished.`);
    }
    return next;
  }

  upvote(id: string, userId: string): Report | undefined {
    const idx = this.reports.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    const current = this.reports[idx];
    
    // Check if user already upvoted
    if (current.upvotedBy?.includes(userId)) {
      return current; // Already upvoted
    }
    
    const newUpvotes = (current.upvotes || 0) + 1;
    const newUpvotedBy = [...(current.upvotedBy || []), userId];
    
    // Update priority based on upvotes: 0-2 = low, 3-5 = medium, 6+ = high
    const newPriority: ReportPriority = newUpvotes >= 6 ? 'high' : newUpvotes >= 3 ? 'medium' : 'low';
    
    const next: Report = { 
      ...current, 
      upvotes: newUpvotes,
      upvotedBy: newUpvotedBy,
      priority: newPriority,
      priorityScore: newUpvotes
    };
    this.reports[idx] = next;
    return next;
  }

  listByArea(userLocation?: { lat: number; lng: number }, radiusKm = 10): Report[] {
    console.log(`listByArea called with userLocation:`, userLocation, `total reports:`, this.reports.length);
    
    if (!userLocation) {
      // If no location provided, return all reports with location data
      const reportsWithLocation = this.reports.filter(report => report.location);
      console.log(`No user location, returning ${reportsWithLocation.length} reports with location data`);
      return reportsWithLocation;
    }
    
    const filteredReports = this.reports.filter(report => {
      if (!report.location) return false;
      
      const distance = this.calculateDistance(userLocation, report.location);
      return distance <= radiusKm;
    });
    
    console.log(`Filtered ${filteredReports.length} reports within ${radiusKm}km of user location`);
    return filteredReports;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  addTestReports(): number {
    // Add some test reports in common areas for testing
    // Use a wider range of locations to ensure visibility
    const testReports = [
      {
        title: "Broken streetlight on Main Road",
        description: "Streetlight has been broken for 3 days, making the area unsafe at night",
        category: 'electricity' as ReportCategory,
        createdByUserId: 'test-user-1',
        createdByUsername: 'Test User 1',
        location: { lat: 13.0827, lng: 80.2707 }, // Chennai center
        locationName: 'T. Nagar, Chennai',
      },
      {
        title: "Sewage overflow near bus stop",
        description: "Sewage is overflowing and causing bad smell in the area",
        category: 'sewage' as ReportCategory,
        createdByUserId: 'test-user-2',
        createdByUsername: 'Test User 2',
        location: { lat: 13.0827, lng: 80.2707 }, // Chennai center
        locationName: 'Velachery, Chennai',
      },
      {
        title: "Pothole on highway",
        description: "Large pothole causing traffic issues and vehicle damage",
        category: 'roads' as ReportCategory,
        createdByUserId: 'test-user-3',
        createdByUsername: 'Test User 3',
        location: { lat: 12.9716, lng: 77.5946 }, // Bangalore center
        locationName: 'Koramangala, Bengaluru',
      },
      {
        title: "Garbage not collected",
        description: "Garbage has not been collected for a week, causing health issues",
        category: 'waste' as ReportCategory,
        createdByUserId: 'test-user-4',
        createdByUsername: 'Test User 4',
        location: { lat: 17.3850, lng: 78.4867 }, // Hyderabad center
        locationName: 'Hitech City, Hyderabad',
      },
      {
        title: "Bus stop shelter damaged",
        description: "Bus stop shelter is damaged and needs repair",
        category: 'transport' as ReportCategory,
        createdByUserId: 'test-user-5',
        createdByUsername: 'Test User 5',
        location: { lat: 19.0760, lng: 72.8777 }, // Mumbai center
        locationName: 'Andheri, Mumbai',
      },
      // Add some reports in more common areas
      {
        title: "Water logging on street",
        description: "Heavy rain caused water logging, making it difficult to walk",
        category: 'sewage' as ReportCategory,
        createdByUserId: 'test-user-6',
        createdByUsername: 'Test User 6',
        location: { lat: 28.6139, lng: 77.2090 }, // Delhi center
        locationName: 'Dwarka, Delhi',
      },
      {
        title: "Power outage in area",
        description: "No electricity for the past 6 hours",
        category: 'electricity' as ReportCategory,
        createdByUserId: 'test-user-7',
        createdByUsername: 'Test User 7',
        location: { lat: 18.5204, lng: 73.8567 }, // Pune center
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
      
      // Add some upvotes to make them more interesting
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

  private priorityToBaseScore(p: ReportPriority): number {
    if (p === 'high') return 5;
    if (p === 'medium') return 2;
    return 0;
  }

  private seedSampleData(count: number) {
    if (this.reports.length > 0) return; // avoid reseeding on hot reload
    const categories: ReportCategory[] = ['sewage', 'electricity', 'waste', 'roads', 'transport', 'other'];
    const priorities: ReportPriority[] = ['low', 'medium', 'high'];
    const statuses: ReportStatus[] = ['in_progress', 'accepted', 'rejected', 'finished'];
    // City centers (lat,lng) with optional wards for richer names
    const cities: Array<{ city: string; center: { lat: number; lng: number }; wards: string[] }> = [
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

    function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
    function jitter(base: number, delta: number): number { return base + (Math.random() - 0.5) * delta; }

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

      // Generate random upvotes for some reports (more realistic distribution)
      const upvotes = Math.random() > 0.5 ? Math.floor(Math.random() * 12) : 0;
      const upvotedBy = upvotes > 0 ? users.slice(0, Math.min(upvotes, users.length)).map(u => u.id) : [];
      const calculatedPriority: ReportPriority = upvotes >= 6 ? 'high' : upvotes >= 3 ? 'medium' : 'low';
      
      const seeded: Report = {
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
}



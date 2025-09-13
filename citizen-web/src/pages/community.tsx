import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Home.module.css";
import { Navbar } from "@/shared/components/Navbar";
import { useLanguage } from "@/shared/language/LanguageContext";
import { useUser } from "@/shared/user/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined' ? 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 
    'http://localhost:4000' : 
    `${window.location.protocol}//192.168.168.229:4000`) : 
  "http://localhost:4000");

type ReportPriority = "low" | "medium" | "high";
type ReportCategory = "sewage" | "electricity" | "waste" | "roads" | "transport" | "other";

type Report = {
  id: string;
  title: string;
  description: string;
  priority: ReportPriority;
  upvotes?: number;
  upvotedBy?: string[];
  category: ReportCategory;
  status: "in_progress" | "accepted" | "rejected" | "finished";
  createdAt: string;
  createdByUserId: string;
  createdByUsername?: string;
  attachments?: string[];
  location?: { lat: number; lng: number };
  locationName?: string;
};

export default function Community() {
  const { t } = useLanguage();
  const { user, token, isLoggedIn } = useUser();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterCategory, setFilterCategory] = useState<ReportCategory | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "upvotes" | "priority">("newest");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // If location access denied, still load reports without location filter
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Load community reports
  useEffect(() => {
    if (!token) return;
    
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (userLocation) {
          params.set('lat', userLocation.lat.toString());
          params.set('lng', userLocation.lng.toString());
        }
        
        const response = await fetch(`${API_BASE}/reports/community?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Community reports error:', response.status, errorText);
          throw new Error(`Failed to load community reports: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Community reports loaded:', data.length, 'reports');
        console.log('User location:', userLocation);
        console.log('Reports data:', data);
        setReports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [token, userLocation]);

  // Listen for new report submissions to refresh the list
  useEffect(() => {
    const handleReportSubmitted = () => {
      // Reload community reports when a new report is submitted
      if (token) {
        const loadReports = async () => {
          try {
            const params = new URLSearchParams();
            if (userLocation) {
              params.set('lat', userLocation.lat.toString());
              params.set('lng', userLocation.lng.toString());
            }
            
            const response = await fetch(`${API_BASE}/reports/community?${params.toString()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              setReports(data);
            }
          } catch (err) {
            console.error('Failed to refresh community reports:', err);
          }
        };
        loadReports();
      }
    };

    window.addEventListener('reportSubmitted', handleReportSubmitted);
    return () => window.removeEventListener('reportSubmitted', handleReportSubmitted);
  }, [token, userLocation]);

  const handleUpvote = async (reportId: string) => {
    if (!token || !user) return;
    
    try {
      const response = await fetch(`${API_BASE}/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to upvote');
      }
      
      const updatedReport = await response.json();
      
      // Update the report in the list
      setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const isUpvoted = (report: Report) => {
    return report.upvotedBy?.includes(user?.id || '') || false;
  };

  const filteredAndSortedReports = reports
    .filter(report => !filterCategory || report.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'upvotes':
          return (b.upvotes || 0) - (a.upvotes || 0);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  if (!isLoggedIn) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>Community Reports</title>
        <meta name="description" content="View and upvote community reports" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Community Reports</h1>
          
          <div className={styles.card}>
            <div className={styles.communityControls}>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Filter by Category</label>
                <select 
                  className={styles.select} 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value as ReportCategory | "")}
                >
                  <option value="">All Categories</option>
                  <option value="sewage">Sewage</option>
                  <option value="electricity">Electricity</option>
                  <option value="waste">Waste</option>
                  <option value="roads">Roads</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Sort by</label>
                <select 
                  className={styles.select} 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as "newest" | "upvotes" | "priority")}
                >
                  <option value="newest">Newest First</option>
                  <option value="upvotes">Most Upvoted</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.button} ${styles.warning}`}
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE}/reports/test-seed`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                      const result = await response.json();
                      alert(`Added ${result.count} test reports!`);
                      
                      // Reload the reports without page reload
                      const params = new URLSearchParams();
                      if (userLocation) {
                        params.set('lat', userLocation.lat.toString());
                        params.set('lng', userLocation.lng.toString());
                      }
                      
                      const reloadResponse = await fetch(`${API_BASE}/reports/community?${params.toString()}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      if (reloadResponse.ok) {
                        const data = await reloadResponse.json();
                        setReports(data);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to add test reports:', err);
                  }
                }}
              >
                🧪 Add Test Data
              </button>
              
              <button 
                className={`${styles.button} ${styles.info}`}
                onClick={() => {
                  // Force reload without location to see all reports
                  setUserLocation(null);
                  // Trigger a reload of the reports without page reload
                  if (token) {
                    const loadReports = async () => {
                      try {
                        setLoading(true);
                        setError(null);
                        
                        const response = await fetch(`${API_BASE}/reports/community`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        if (!response.ok) {
                          const errorText = await response.text();
                          console.error('Community reports error:', response.status, errorText);
                          throw new Error(`Failed to load community reports: ${response.status} ${errorText}`);
                        }
                        
                        const data = await response.json();
                        console.log('Community reports loaded (all):', data.length, 'reports');
                        console.log('Reports data:', data);
                        setReports(data);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to load reports');
                      } finally {
                        setLoading(false);
                      }
                    };
                    loadReports();
                  }
                }}
              >
                🌍 Show All Reports
              </button>
            </div>
              
              {userLocation && (
                <span style={{ fontSize: '12px', color: '#666' }}>
                  📍 Showing reports within 10km of your location
                </span>
              )}
            </div>

            {loading && <p>Loading community reports...</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            
            {!loading && !error && filteredAndSortedReports.length === 0 && (
              <div>
                <p>No community reports found in your area.</p>
                {!userLocation && (
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    Location access was denied. Showing all reports with location data.
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  Try clicking "Add Test Data" to add some sample reports for testing.
                </p>
              </div>
            )}
            
            {!loading && !error && filteredAndSortedReports.length > 0 && (
              <div className={styles.communityReports}>
                {filteredAndSortedReports.map((report) => (
                  <div key={report.id} className={styles.reportCard}>
                    <div className={styles.reportHeader}>
                      <h3 className={styles.reportTitle}>{report.title}</h3>
                      <div className={styles.reportMeta}>
                        <span 
                          className={styles.reportStatus}
                          style={{
                            backgroundColor: report.status === 'finished' ? '#10b981' : 
                                           report.status === 'in_progress' ? '#f59e0b' : 
                                           report.status === 'accepted' ? '#3b82f6' : '#ef4444',
                            color: 'white'
                          }}
                        >
                          {report.status}
                        </span>
                        <span 
                          className={styles.reportPriority}
                          style={{
                            backgroundColor: report.priority === 'high' ? '#ef4444' : 
                                           report.priority === 'medium' ? '#f59e0b' : '#6b7280',
                            color: 'white'
                          }}
                        >
                          {report.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className={styles.reportDescription}>{report.description}</p>
                    
                    <div className={styles.reportFooter}>
                      <div className={styles.reportInfo}>
                        <div className={styles.reportLocation}>
                          📍 {report.locationName || 'Location not specified'}
                        </div>
                        <div className={styles.reportDate}>
                          📅 {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className={styles.reportActions}>
                        <button
                          onClick={() => handleUpvote(report.id)}
                          className={`${styles.upvoteButton} ${isUpvoted(report) ? styles.upvoted : ''}`}
                          disabled={isUpvoted(report)}
                        >
                          👍 {report.upvotes || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </main>
      </div>
    </>
  );
}

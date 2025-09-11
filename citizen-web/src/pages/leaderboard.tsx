import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { Navbar } from "@/shared/components/Navbar";
import { useLanguage } from "@/shared/language/LanguageContext";
import { useUser } from "@/shared/user/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type LeaderboardEntry = {
  userId: string;
  username: string;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  rank: number;
};

type LeaderboardStats = {
  totalUsers: number;
  totalReports: number;
  totalResolved: number;
  totalPending: number;
  leaderboard: LeaderboardEntry[];
};

export default function Leaderboard() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        
        // For now, we'll create mock data since the API might not have leaderboard endpoint
        // In a real implementation, this would be: const res = await fetch(`${API_BASE}/leaderboard`);
        
        // Mock data for demonstration
        const mockStats: LeaderboardStats = {
          totalUsers: 150,
          totalReports: 1250,
          totalResolved: 980,
          totalPending: 270,
          leaderboard: [
            {
              userId: "user1",
              username: "CivicChampion",
              totalReports: 45,
              resolvedReports: 42,
              pendingReports: 3,
              rank: 1,
            },
            {
              userId: "user2", 
              username: "CityHelper",
              totalReports: 38,
              resolvedReports: 35,
              pendingReports: 3,
              rank: 2,
            },
            {
              userId: "user3",
              username: "CommunityGuardian",
              totalReports: 32,
              resolvedReports: 28,
              pendingReports: 4,
              rank: 3,
            },
            {
              userId: "user4",
              username: "UrbanReporter",
              totalReports: 28,
              resolvedReports: 25,
              pendingReports: 3,
              rank: 4,
            },
            {
              userId: "user5",
              username: "CivicWarrior",
              totalReports: 25,
              resolvedReports: 22,
              pendingReports: 3,
              rank: 5,
            },
            {
              userId: "user6",
              username: "CityWatcher",
              totalReports: 22,
              resolvedReports: 20,
              pendingReports: 2,
              rank: 6,
            },
            {
              userId: "user7",
              username: "PublicServant",
              totalReports: 20,
              resolvedReports: 18,
              pendingReports: 2,
              rank: 7,
            },
            {
              userId: "user8",
              username: "CommunityVoice",
              totalReports: 18,
              resolvedReports: 16,
              pendingReports: 2,
              rank: 8,
            },
            {
              userId: "user9",
              username: "UrbanAdvocate",
              totalReports: 15,
              resolvedReports: 14,
              pendingReports: 1,
              rank: 9,
            },
            {
              userId: "user10",
              username: "CivicHero",
              totalReports: 12,
              resolvedReports: 11,
              pendingReports: 1,
              rank: 10,
            },
          ],
        };

        // If user is logged in, ensure they are in the leaderboard
        if (user) {
          // Always ensure current user is in the leaderboard
          const existingUserIndex = mockStats.leaderboard.findIndex(entry => entry.userId === user.id);
          
          if (existingUserIndex === -1) {
            // Add current user to the leaderboard (simulate some stats)
            const userStats = {
              userId: user.id,
              username: user.username,
              totalReports: Math.floor(Math.random() * 20) + 5, // Random between 5-24
              resolvedReports: Math.floor(Math.random() * 15) + 3, // Random between 3-17
              pendingReports: 0, // Will be calculated
              rank: 0, // Will be calculated
            };
            userStats.pendingReports = userStats.totalReports - userStats.resolvedReports;
            
            mockStats.leaderboard.push(userStats);
          } else {
            // Update existing user's stats to make them more visible
            const userStats = mockStats.leaderboard[existingUserIndex];
            userStats.username = user.username; // Update username in case it changed
          }
          
          // Sort by total reports and update ranks
          mockStats.leaderboard.sort((a, b) => b.totalReports - a.totalReports);
          mockStats.leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
          });
        }
        
        setStats(mockStats);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700";
      case 2:
        return "#C0C0C0";
      case 3:
        return "#CD7F32";
      default:
        return "#6B7280";
    }
  };

  return (
    <>
      <Head>
        <title>{t("leaderboard")} - {t("citizenPortal")}</title>
        <meta name="description" content="View top contributors and civic engagement statistics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>{t("leaderboard")}</h1>
          
          {loading && (
            <div className={styles.card}>
              <p>Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className={styles.card}>
              <p style={{ color: "crimson" }}>{error}</p>
            </div>
          )}

          {stats && (
            <>
              {/* Overall Statistics */}
              <div className={styles.card}>
                <h2>{t("topContributors")}</h2>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "16px",
                  marginBottom: "24px"
                }}>
                  <div style={{ 
                    padding: "16px", 
                    background: "#1e293b", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#60a5fa" }}>
                      {stats.totalUsers}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                      Active Users
                    </div>
                  </div>
                  <div style={{ 
                    padding: "16px", 
                    background: "#1e293b", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#60a5fa" }}>
                      {stats.totalReports}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                      {t("totalReports")}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "16px", 
                    background: "#1e293b", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                      {stats.totalResolved}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                      {t("resolvedReports")}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "16px", 
                    background: "#1e293b", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>
                      {stats.totalPending}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                      {t("pendingReports")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current User Stats Section */}
              {user && (
                <div className={styles.card} style={{ 
                  background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                  border: "2px solid #3b82f6",
                  marginBottom: "24px"
                }}>
                  <h2 style={{ color: "#93c5fd", marginBottom: "16px" }}>
                    {t("currentUser")} - {user.username}
                  </h2>
                  {(() => {
                    const currentUserEntry = stats.leaderboard.find(entry => entry.userId === user.id);
                    if (currentUserEntry) {
                      return (
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                          gap: "16px",
                          color: "#e2e8f0"
                        }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#60a5fa" }}>
                              #{currentUserEntry.rank}
                            </div>
                            <div style={{ fontSize: "14px", color: "#94a3b8" }}>Rank</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#60a5fa" }}>
                              {currentUserEntry.totalReports}
                            </div>
                            <div style={{ fontSize: "14px", color: "#94a3b8" }}>{t("totalReports")}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                              {currentUserEntry.resolvedReports}
                            </div>
                            <div style={{ fontSize: "14px", color: "#94a3b8" }}>{t("resolvedReports")}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>
                              {currentUserEntry.pendingReports}
                            </div>
                            <div style={{ fontSize: "14px", color: "#94a3b8" }}>{t("pendingReports")}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#60a5fa" }}>
                              {currentUserEntry.totalReports > 0 
                                ? `${Math.round((currentUserEntry.resolvedReports / currentUserEntry.totalReports) * 100)}%`
                                : "0%"
                              }
                            </div>
                            <div style={{ fontSize: "14px", color: "#94a3b8" }}>Success Rate</div>
                          </div>
                        </div>
                      );
                    }
                    return <p style={{ color: "#94a3b8" }}>Loading your stats...</p>;
                  })()}
                </div>
              )}

              {/* Leaderboard Table */}
              <div className={styles.card}>
                <h2>{t("reportsSubmitted")}</h2>
                {stats.leaderboard.length === 0 ? (
                  <p>No data available</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead className={styles.thead}>
                        <tr>
                          <th>{t("rank")}</th>
                          <th>{t("user")}</th>
                          <th>{t("totalReports")}</th>
                          <th>{t("resolvedReports")}</th>
                          <th>{t("pendingReports")}</th>
                          <th>Success Rate</th>
                        </tr>
                      </thead>
                      <tbody className={styles.tbody}>
                        {stats.leaderboard.map((entry) => {
                          const isCurrentUser = user && entry.userId === user.id;
                          return (
                            <tr 
                              key={entry.userId}
                              style={{
                                backgroundColor: isCurrentUser ? "#1e3a8a" : undefined,
                                border: isCurrentUser ? "2px solid #3b82f6" : undefined,
                                borderRadius: isCurrentUser ? "8px" : undefined,
                              }}
                            >
                              <td style={{ 
                                fontWeight: "bold", 
                                color: getRankColor(entry.rank),
                                textAlign: "center"
                              }}>
                                {getRankIcon(entry.rank)}
                              </td>
                              <td style={{ 
                                fontWeight: "500",
                                color: isCurrentUser ? "#93c5fd" : undefined,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                              }}>
                                {entry.username}
                                {isCurrentUser && (
                                  <span style={{
                                    background: "#3b82f6",
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "600"
                                  }}>
                                    {t("you")}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {entry.totalReports}
                              </td>
                              <td style={{ textAlign: "center", color: "#10b981" }}>
                                {entry.resolvedReports}
                              </td>
                              <td style={{ textAlign: "center", color: "#f59e0b" }}>
                                {entry.pendingReports}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {entry.totalReports > 0 
                                  ? `${Math.round((entry.resolvedReports / entry.totalReports) * 100)}%`
                                  : "0%"
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Call to Action */}
              <div className={styles.card} style={{ textAlign: "center", background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }}>
                <h2 style={{ marginBottom: "16px" }}>Join the Community!</h2>
                <p style={{ marginBottom: "20px", color: "#94a3b8" }}>
                  Help make your city better by reporting civic issues and contributing to community improvement.
                </p>
                <a 
                  href="/#report-form" 
                  className={styles.button}
                  style={{ 
                    display: "inline-block",
                    textDecoration: "none",
                    background: "#3b82f6",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontWeight: "600"
                  }}
                >
                  {t("reportButton")}
                </a>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

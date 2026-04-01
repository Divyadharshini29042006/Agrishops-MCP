// frontend/src/pages/retailer/RetailerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCube, HiShoppingCart, HiCurrencyRupee, HiTrendingUp,
  HiExclamationCircle, HiClock, HiCheckCircle, HiTruck,
  HiClipboardList, HiShoppingBag, HiChartBar, HiRefresh, HiStar
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import ExpiryAlert from '../../components/retailer/ExpiryAlert';
import MerchantStockAlert from '../../components/MerchantStockAlert';

const RetailerDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      checkExpiryAlerts();
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/retailer/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiryAlerts = async () => {
    try {
      await api.post('/retailer/check-expiry-alerts');
    } catch (error) {
      console.error('Error checking expiry alerts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await checkExpiryAlerts();
    showSuccess('Dashboard refreshed');
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingInner}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Inventory',
      value: stats?.inventory?.total || 0,
      icon: HiCube,
      accent: '#2563EB',
      bg: '#EFF6FF',
      link: '/retailer/inventory',
    },
    {
      title: 'Pending Orders',
      value: stats?.orders?.pending || 0,
      icon: HiClock,
      accent: '#D97706',
      bg: '#FFFBEB',
      link: '/retailer/orders?status=pending',
    },
    {
      title: 'Total Orders',
      value: stats?.orders?.total || 0,
      icon: HiClipboardList,
      accent: '#7C3AED',
      bg: '#F5F3FF',
      link: '/retailer/orders',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.revenue?.total?.toLocaleString() || 0}`,
      icon: HiCurrencyRupee,
      accent: '#16A34A',
      bg: '#F0FDF4',
      link: '/retailer/orders',
    },
    {
      title: 'Store Rating',
      value: user?.stats?.avgRating?.toFixed(1) || '0.0',
      icon: HiStar,
      accent: '#F59E0B',
      bg: '#FFFBEB',
      link: '/retailer/reviews',
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header} className="retailer-header">
          <div>
            <h1 style={styles.pageTitle}>Retailer Dashboard</h1>
            <p style={styles.pageSubtitle}>Welcome back, {user?.name}!</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={styles.refreshBtn}
          >
            <HiRefresh style={{ width: 18, height: 18, ...(refreshing ? styles.spin : {}) }} />
            Refresh
          </button>
        </div>

        {/* Alert Banners */}
        <div style={styles.alertSection}>
          {stats.orders?.pending > 0 && (
            <div style={{ ...styles.alertBanner, borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' }}>
              <HiClock style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ ...styles.alertTitle, color: '#991B1B' }}>
                  {stats.orders.pending} New Order{stats.orders.pending !== 1 ? 's' : ''} Pending!
                </p>
                <p style={{ ...styles.alertDesc, color: '#B91C1C' }}>
                  Customers have placed new orders that require your attention.
                </p>
                <Link to="/retailer/orders?status=pending" style={styles.alertLink}>
                  Process Pending Orders →
                </Link>
              </div>
            </div>
          )}

          {stats.alerts?.expiredProducts?.length > 0 && (
            <div style={{ ...styles.alertBanner, borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' }}>
              <HiExclamationCircle style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ ...styles.alertTitle, color: '#991B1B' }}>
                  {stats.alerts.expiredProducts.length} Product{stats.alerts.expiredProducts.length !== 1 ? 's' : ''} Expired
                </p>
                <p style={{ ...styles.alertDesc, color: '#B91C1C' }}>
                  These products have passed their expiry date and should be removed from inventory.
                </p>
                <Link to="/retailer/inventory?status=expired" style={styles.alertLink}>
                  View Expired Products →
                </Link>
              </div>
            </div>
          )}

          {stats.alerts?.expiringProducts?.length > 0 && (
            <ExpiryAlert products={stats.alerts.expiringProducts} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MerchantStockAlert products={stats.alerts?.criticalStockProducts} type="critical" role="retailer" />
            <MerchantStockAlert products={stats.alerts?.lowStockProducts} type="low" role="retailer" />
          </div>
        </div>

        {/* Stat Cards */}
        <div style={styles.statGrid} className="retailer-stat-grid">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Link key={index} to={stat.link} style={styles.statCard} className="retailer-stat-card">
                <div>
                  <p style={styles.statLabel}>{stat.title}</p>
                  <p style={styles.statValue}>{stat.value}</p>
                </div>
                <div style={{ ...styles.statIconWrap, backgroundColor: stat.bg }} className="retailer-stat-icon-wrap">
                  <IconComponent style={{ width: 28, height: 28, color: stat.accent }} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Revenue Cards — flat solid colours, no gradient */}
        <div style={styles.revenueGrid} className="retailer-revenue-grid">
          <div style={{ ...styles.revenueCard, backgroundColor: '#16A34A' }} className="retailer-revenue-card">
            <div style={styles.revenueCardHeader}>
              <span style={styles.revenueCardTitle}>Today's Revenue</span>
              <HiCurrencyRupee style={{ width: 26, height: 26, opacity: 0.85 }} />
            </div>
            <p style={styles.revenueAmount} className="retailer-revenue-amount">₹{stats?.revenue?.today?.toLocaleString() || 0}</p>
            <p style={styles.revenueFooter}>{stats?.orders?.today || 0} orders today</p>
          </div>

          <div style={{ ...styles.revenueCard, backgroundColor: '#2563EB' }} className="retailer-revenue-card">
            <div style={styles.revenueCardHeader}>
              <span style={styles.revenueCardTitle}>This Week</span>
              <HiChartBar style={{ width: 26, height: 26, opacity: 0.85 }} />
            </div>
            <p style={styles.revenueAmount} className="retailer-revenue-amount">₹{stats?.revenue?.week?.toLocaleString() || 0}</p>
            <p style={styles.revenueFooter}>{stats?.orders?.week || 0} orders this week</p>
          </div>

          <div style={{ ...styles.revenueCard, backgroundColor: '#7C3AED' }} className="retailer-revenue-card">
            <div style={styles.revenueCardHeader}>
              <span style={styles.revenueCardTitle}>This Month</span>
              <HiTrendingUp style={{ width: 26, height: 26, opacity: 0.85 }} />
            </div>
            <p style={styles.revenueAmount} className="retailer-revenue-amount">₹{stats?.revenue?.month?.toLocaleString() || 0}</p>
            <p style={styles.revenueFooter}>{stats?.orders?.month || 0} orders this month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.quickActionsGrid} className="retailer-quick-actions-grid">
            <Link to="/retailer/suppliers/products" style={{ ...styles.quickActionBtn, backgroundColor: '#2563EB' }} className="retailer-quick-action-btn">
              <div style={styles.quickActionIconWrap}>
                <HiShoppingCart style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <p style={styles.quickActionLabel}>Buy from Suppliers</p>
                <p style={styles.quickActionSub}>Browse wholesale catalog</p>
              </div>
            </Link>

            <Link to="/retailer/inventory" style={{ ...styles.quickActionBtn, backgroundColor: '#16A34A' }} className="retailer-quick-action-btn">
              <div style={styles.quickActionIconWrap}>
                <HiCube style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <p style={styles.quickActionLabel}>Manage Inventory</p>
                <p style={styles.quickActionSub}>View & update stock</p>
              </div>
            </Link>

            <Link to="/retailer/orders" style={{ ...styles.quickActionBtn, backgroundColor: '#7C3AED' }} className="retailer-quick-action-btn">
              <div style={styles.quickActionIconWrap}>
                <HiClipboardList style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <p style={styles.quickActionLabel}>View Orders</p>
                <p style={styles.quickActionSub}>Process customer orders</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={styles.bottomGrid} className="retailer-bottom-grid">
          {stats?.topProducts?.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.sectionTitle}>Top Selling Products</h2>
                <HiTrendingUp style={{ width: 20, height: 20, color: '#16A34A' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.topProducts.map((product, index) => (
                  <div key={product._id} style={styles.listRow}>
                    <div style={styles.rankBadge}>#{index + 1}</div>
                    <img
                      src={product.images?.[0]?.url || '/placeholder-product.png'}
                      alt={product.name}
                      style={styles.productThumb}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={styles.listPrimary}>{product.name}</p>
                      <p style={styles.listSecondary}>₹{product.pricing?.finalPrice} • Sold: {product.soldQuantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.recentOrders?.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.sectionTitle}>Recent Customer Orders</h2>
                <Link to="/retailer/orders" style={styles.viewAllLink}>View All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.recentOrders.map((order) => (
                  <Link key={order._id} to={`/retailer/orders/${order._id}`} style={styles.listRow}>
                    <div style={{
                      ...styles.statusIconWrap,
                      backgroundColor: order.status === 'pending' ? '#FFFBEB' : order.status === 'delivered' ? '#F0FDF4' : '#EFF6FF'
                    }}>
                      {order.status === 'pending'
                        ? <HiClock style={{ width: 18, height: 18, color: '#D97706' }} />
                        : order.status === 'delivered'
                          ? <HiCheckCircle style={{ width: 18, height: 18, color: '#16A34A' }} />
                          : <HiTruck style={{ width: 18, height: 18, color: '#2563EB' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p style={styles.listPrimary}>{order.orderNumber}</p>
                        <p style={styles.listPrimary}>₹{order.totalAmount}</p>
                      </div>
                      <p style={styles.listSecondary}>{order.customer?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span style={{
                      ...styles.statusPill,
                      backgroundColor: order.status === 'pending' ? '#FFFBEB' : order.status === 'delivered' ? '#F0FDF4' : '#EFF6FF',
                      color: order.status === 'pending' ? '#92400E' : order.status === 'delivered' ? '#14532D' : '#1E3A8A'
                    }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        {stats?.recentPurchases?.length > 0 && (
          <div style={{ ...styles.card, marginTop: 24 }}>
            <div style={styles.cardHeader}>
              <h2 style={styles.sectionTitle}>Recent Purchases from Suppliers</h2>
              <Link to="/retailer/inventory" style={styles.viewAllLink}>Browse Inventory →</Link>
            </div>
            <div style={styles.purchasesGrid} className="retailer-purchases-grid">
              {stats.recentPurchases.map((purchase) => (
                <Link key={purchase._id} to={`/retailer/orders/${purchase._id}`} style={styles.purchaseCard}>
                  <div style={{
                    ...styles.statusIconWrap,
                    backgroundColor: purchase.status === 'pending' ? '#FFFBEB' : purchase.status === 'delivered' ? '#F0FDF4' : '#EFF6FF'
                  }}>
                    {purchase.status === 'pending'
                      ? <HiClock style={{ width: 18, height: 18, color: '#D97706' }} />
                      : purchase.status === 'delivered'
                        ? <HiCheckCircle style={{ width: 18, height: 18, color: '#16A34A' }} />
                        : <HiTruck style={{ width: 18, height: 18, color: '#2563EB' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...styles.listPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {purchase.orderNumber}
                    </p>
                    <p style={{ ...styles.listSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {purchase.seller?.businessName || purchase.seller?.name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{
                        ...styles.statusPill,
                        backgroundColor: purchase.status === 'pending' ? '#FFFBEB' : purchase.status === 'delivered' ? '#F0FDF4' : '#EFF6FF',
                        color: purchase.status === 'pending' ? '#92400E' : purchase.status === 'delivered' ? '#14532D' : '#1E3A8A'
                      }}>
                        {purchase.status}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>₹{purchase.totalAmount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinIcon { to { transform: rotate(360deg); } }

        /* ✅ MOBILE RESPONSIVENESS */
        @media (max-width: 640px) {
          .retailer-stat-grid, .retailer-revenue-grid, .retailer-quick-actions-grid, .retailer-purchases-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          
          .retailer-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }

          .retailer-stat-card {
            padding: 14px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            gap: 12px !important;
          }

          .retailer-stat-icon-wrap {
            order: -1 !important;
            padding: 8px !important;
          }

          .retailer-stat-value {
            font-size: 20px !important;
          }

          .retailer-revenue-card {
            padding: 16px !important;
          }

          .retailer-revenue-amount {
            font-size: 20px !important;
          }

          .retailer-quick-action-btn {
            padding: 12px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            text-align: left !important;
          }

          .retailer-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    paddingTop: 32,
    paddingBottom: 48,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 18px',
    backgroundColor: '#fff',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  spin: {
    animation: 'spinIcon 1s linear infinite',
  },

  /* Alerts */
  alertSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 28,
  },
  alertBanner: {
    display: 'flex',
    gap: 12,
    borderLeft: '4px solid',
    borderRadius: 10,
    padding: '14px 16px',
    alignItems: 'flex-start',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
  },
  alertDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  alertLink: {
    fontSize: 13,
    fontWeight: 700,
    color: '#991B1B',
    textDecoration: 'underline',
    display: 'inline-block',
    marginTop: 6,
  },

  /* Stat cards */
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    border: '1.5px solid #E2E8F0',
    padding: '20px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textDecoration: 'none',
    transition: 'box-shadow 0.2s, transform 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: 500,
    margin: 0,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 800,
    color: '#0F172A',
    marginTop: 6,
    letterSpacing: '-1px',
  },
  statIconWrap: {
    padding: 12,
    borderRadius: 12,
  },

  /* Revenue */
  revenueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  revenueCard: {
    borderRadius: 14,
    padding: '22px 24px',
    color: '#fff',
  },
  revenueCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueCardTitle: {
    fontSize: 15,
    fontWeight: 600,
  },
  revenueAmount: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: '-1px',
    margin: 0,
  },
  revenueFooter: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 6,
  },

  /* Generic card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    border: '1.5px solid #E2E8F0',
    padding: '22px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2563EB',
    textDecoration: 'none',
  },

  /* Quick actions */
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  quickActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 12,
    textDecoration: 'none',
    color: '#fff',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  quickActionIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    padding: 8,
    borderRadius: 8,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
    color: '#fff',
  },
  quickActionSub: {
    fontSize: 12,
    opacity: 0.82,
    marginTop: 2,
    color: '#fff',
  },

  /* Bottom grid */
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
    marginTop: 20,
  },

  /* List rows */
  listRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid #F1F5F9',
    textDecoration: 'none',
    backgroundColor: '#FAFAFA',
    transition: 'background 0.15s',
  },
  rankBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontWeight: 700,
    fontSize: 12,
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productThumb: {
    width: 44,
    height: 44,
    objectFit: 'cover',
    borderRadius: 8,
    flexShrink: 0,
  },
  listPrimary: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
  },
  listSecondary: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusIconWrap: {
    padding: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusPill: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 20,
    flexShrink: 0,
  },

  /* Purchases grid */
  purchasesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
  },
  purchaseCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 10,
    border: '1.5px solid #F1F5F9',
    textDecoration: 'none',
    backgroundColor: '#FAFAFA',
    transition: 'background 0.15s',
  },

  /* Loading */
  loadingWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingInner: {
    textAlign: 'center',
  },
  spinner: {
    width: 44,
    height: 44,
    border: '3px solid #E2E8F0',
    borderTop: '3px solid #16A34A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  loadingText: {
    marginTop: 14,
    color: '#64748B',
    fontSize: 14,
  },
};

export default RetailerDashboard;
import { useState, useEffect, useMemo } from 'react';
import {
  HiX,
  HiCheckCircle,
  HiArrowRight,
  HiExclamationCircle,
  HiInformationCircle,
  HiChartBar,
  HiMinus,
  HiPlus,
  HiLightningBolt,
  HiSparkles,
  HiShieldCheck,
  HiTrendingUp,
} from 'react-icons/hi';
import useToast from '../hooks/useToast';
import api from '../services/api';

const BulkOrderModal = ({ product, selectedVariant, quantity, onClose }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    fetchComparison();
  }, [product._id, selectedVariant?._id, quantity]);

  useEffect(() => {
    if (selectedSupplier) {
      const initialSelections = {};
      selectedSupplier.variants?.forEach(v => {
        initialSelections[v._id] = 0;
      });
      selectedSupplier.recommendedCombination?.forEach(rec => {
        const variant = selectedSupplier.variants.find(v => v.size === rec.size);
        if (variant) initialSelections[variant._id] = rec.quantity;
      });
      setSelections(initialSelections);
    }
  }, [selectedSupplier]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/wholesale/compare/${product._id}`, {
        params: { quantity, variantId: selectedVariant?._id }
      });
      setComparisonData(response.data.data);
      if (response.data.data.suppliers?.length > 0) {
        setSelectedSupplier(response.data.data.suppliers[0]);
      }
    } catch (error) {
      showError('Failed to fetch supplier comparison');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!selectedSupplier || !selections) return { weightKg: 0, cost: 0, count: 0 };
    let weightGrams = 0, cost = 0, count = 0;
    Object.entries(selections).forEach(([id, qty]) => {
      if (qty > 0) {
        const variant = selectedSupplier.variants.find(v => v._id === id);
        if (variant) {
          weightGrams += (variant.weightInGrams || 0) * qty;
          cost += variant.finalPrice * qty;
          count += qty;
        }
      }
    });
    return { weightKg: weightGrams / 1000, cost, count };
  }, [selections, selectedSupplier]);

  const handleQuantityChange = (variantId, delta) => {
    setSelections(prev => {
      const current = prev[variantId] || 0;
      const newValue = Math.max(0, current + delta);
      const variant = selectedSupplier.variants.find(v => v._id === variantId);
      if (delta > 0 && variant && newValue > variant.stock) {
        showError(`Only ${variant.stock} units available in stock`);
        return prev;
      }
      return { ...prev, [variantId]: newValue };
    });
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) { showError('Please select a supplier'); return; }
    if (totals.weightKg < (comparisonData?.thresholdKg || 1)) {
      showError(`Total weight must be at least ${comparisonData?.thresholdKg}kg for bulk prices`);
      return;
    }
    if (!message.trim()) { showError('Please enter a message for the supplier'); return; }

    const structuredVariants = Object.entries(selections)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const v = selectedSupplier.variants.find(varnt => varnt._id === id);
        return {
          variantId: id,
          size: v.size,
          quantity: qty,
          price: v.finalPrice,
          subtotal: qty * v.finalPrice
        };
      });

    const breakdownText = structuredVariants
      .map(v => `${v.quantity}x ${v.size} bags`)
      .join(', ');

    const fullMessage = `${message}\n\n[Requested Breakdown: ${breakdownText} | Total: ${totals.weightKg}kg]`;

    try {
      setSubmitting(true);
      await api.post('/api/wholesale', {
        productId: selectedSupplier.productId,
        quantity: totals.count,
        message: fullMessage,
        selectedVariants: structuredVariants,
        totalWeightKg: totals.weightKg,
        basePricePerKg: selectedSupplier.pricePerKg,
      });
      showSuccess(`Bulk order inquiry sent to ${selectedSupplier.name}!`);
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Analysing markets & pricing…</p>
        </div>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  const { suppliers, savings } = comparisonData || {};
  const thresholdKg = comparisonData?.thresholdKg || 1;
  const meetsThreshold = totals.weightKg >= thresholdKg;

  return (
    <div style={styles.overlay}>
      <style>{css}</style>
      <div style={styles.modal} className="bom-modal">

        {/* ── Header ── */}
        <div style={styles.header} className="bom-header">
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <HiLightningBolt size={18} color="#1a1a1a" />
            </div>
            <div>
              <h3 style={styles.headerTitle}>Smart Bulk-Order System</h3>
              <p style={styles.headerSub}>Comparing verified suppliers for {product.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} className="bom-close-btn">
            <HiX size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={styles.body}>

          {/* LEFT — Supplier list */}
          <div style={styles.leftPane}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionLabel}>
                <HiTrendingUp size={14} style={{ marginRight: 6 }} />
                Live Market Comparison
              </span>
              <span style={styles.thresholdBadge}>
                Threshold: {thresholdKg} KG
              </span>
            </div>

            <div style={styles.supplierList}>
              {suppliers?.length > 0 ? suppliers.map((s, index) => {
                const isSelected = selectedSupplier?.sellerId === s.sellerId;
                return (
                  <button
                    key={s.sellerId}
                    onClick={() => setSelectedSupplier(s)}
                    style={{
                      ...styles.supplierCard,
                      ...(isSelected ? styles.supplierCardSelected : {}),
                    }}
                    className={`bom-supplier-card${isSelected ? ' selected' : ''}`}
                  >
                    {index === 0 && (
                      <div style={styles.bestBadge}>
                        <HiSparkles size={11} style={{ marginRight: 4 }} />
                        Best Price
                      </div>
                    )}
                    <div style={styles.supplierTop}>
                      <div>
                        <p style={styles.supplierName}>{s.name}</p>
                        <div style={styles.supplierStatus}>
                          <HiShieldCheck size={12} style={{ color: s.stock > 1000 ? '#16a34a' : '#ca8a04', marginRight: 4 }} />
                          <span style={{ color: s.stock > 1000 ? '#16a34a' : '#ca8a04', fontSize: 11, fontWeight: 600 }}>
                            {s.stock > 1000 ? 'Ready to Ship' : 'Limited Stock'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={styles.supplierPrice}>₹{s.pricePerKg?.toFixed(2) || '0.00'}</p>
                        <p style={styles.supplierPriceLabel}>Base Price / KG</p>
                      </div>
                    </div>

                    <div style={styles.supplierMeta}>
                      <div style={styles.supplierMetaCell}>
                        <p style={styles.metaLabel}>Stock</p>
                        <p style={styles.metaValue}>{s.stock} Packets</p>
                      </div>
                      <div style={{ ...styles.supplierMetaCell, borderLeft: '1px solid #e5e7eb', paddingLeft: 16 }}>
                        <p style={styles.metaLabel}>Best Bag Size</p>
                        <p style={styles.metaValue}>{s.variants?.[0]?.size || 'N/A'}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={styles.selectedIndicator}>
                        <HiCheckCircle size={14} style={{ marginRight: 6 }} />
                        Supplier Selected
                      </div>
                    )}
                  </button>
                );
              }) : (
                <div style={styles.emptySupplier}>
                  <HiExclamationCircle size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#6b7280', fontWeight: 600, fontSize: 14 }}>No suppliers available for bulk quantities.</p>
                </div>
              )}
            </div>

            {savings > 0 && (
              <div style={styles.savingsBanner}>
                <HiTrendingUp size={18} color="#15803d" style={{ flexShrink: 0 }} />
                <div>
                  <p style={styles.savingsTitle}>Savings Identified</p>
                  <p style={styles.savingsSub}>Average ₹{savings.toLocaleString()} below market rates.</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Order configuration */}
          <div style={styles.rightPane}>
            {selectedSupplier ? (
              <div style={styles.rightContent}>

                {/* Bag Size Selector */}
                <div>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionLabel}>Choose Bag Sizes</span>
                    <span style={{
                      ...styles.weightBadge,
                      background: meetsThreshold ? '#f0fdf4' : '#fef2f2',
                      color: meetsThreshold ? '#15803d' : '#dc2626',
                      border: `1px solid ${meetsThreshold ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                      {totals.weightKg.toFixed(1)} / {thresholdKg} KG
                    </span>
                  </div>

                  <div style={styles.variantList}>
                    {selectedSupplier.variants?.map((v) => {
                      const qty = selections[v._id] || 0;
                      return (
                        <div key={v._id} style={styles.variantRow} className="bom-variant-row">
                          <div>
                            <p style={styles.variantName}>{v.size} Pack</p>
                            <p style={styles.variantPrice}>₹{v.finalPrice.toLocaleString()} per unit</p>
                          </div>
                          <div style={styles.qtyControl}>
                            <button
                              onClick={() => handleQuantityChange(v._id, -1)}
                              style={styles.qtyBtn}
                              className="bom-qty-btn"
                            >
                              <HiMinus size={14} />
                            </button>
                            <span style={styles.qtyValue}>{qty}</span>
                            <button
                              onClick={() => handleQuantityChange(v._id, 1)}
                              style={{ ...styles.qtyBtn, ...styles.qtyBtnPlus }}
                              className="bom-qty-btn-plus"
                            >
                              <HiPlus size={14} />
                            </button>
                          </div>
                          <div style={styles.variantFooter}>
                            <span style={styles.stockLabel}>Stock: {v.stock} avail.</span>
                            <span style={styles.variantSubtotal}>₹{(qty * v.finalPrice).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.totalSection}>
                    <div style={styles.totalRow}>
                      <span style={styles.totalLabel}>Selected Weight</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: meetsThreshold ? '#15803d' : '#dc2626' }}>
                        {totals.weightKg.toFixed(1)} KG
                      </span>
                    </div>
                    <div style={styles.totalPriceBox}>
                      <span style={styles.totalPriceLabel}>Total Est. Price</span>
                      <span style={styles.totalPriceValue}>₹{totals.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Inquiry */}
                <div style={styles.inquirySection}>
                  <p style={styles.sectionLabel}>Inquiry Message</p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Briefly describe your requirement (e.g., wholesale supply for Guntur region)…"
                    style={styles.textarea}
                    className="bom-textarea"
                  />
                </div>

                {/* Actions */}
                <div style={styles.actions}>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !message.trim() || !meetsThreshold}
                    style={{
                      ...styles.submitBtn,
                      ...((submitting || !message.trim() || !meetsThreshold) ? styles.submitBtnDisabled : {}),
                    }}
                    className="bom-submit-btn"
                  >
                    {submitting ? (
                      <><div style={styles.btnSpinner}></div> Sending…</>
                    ) : !meetsThreshold ? (
                      <>{`Add ${(thresholdKg - totals.weightKg).toFixed(1)} KG more`} <HiArrowRight size={16} style={{ marginLeft: 8 }} /></>
                    ) : (
                      <>Secure Bulk Price <HiArrowRight size={16} style={{ marginLeft: 8 }} /></>
                    )}
                  </button>
                  <button onClick={onClose} style={styles.cancelBtn} className="bom-cancel-btn">
                    Cancel & return to product
                  </button>
                </div>

                {/* Note */}
                <div style={styles.infoNote}>
                  <HiInformationCircle size={15} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={styles.infoText}>
                    Submitting this inquiry requests a formal quote for the selected sizes. Suppliers typically respond within 24 hours.
                  </p>
                </div>

              </div>
            ) : (
              <div style={styles.emptyRight}>
                <HiChartBar size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>Select a Supplier</h5>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Choose a supplier from the list to configure your bulk order.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={styles.footer} className="bom-footer">
          <div style={styles.footerLeft}>
            <span style={styles.footerDot('#22c55e')}></span>
            <span style={styles.footerTag}>Market Live</span>
            <span style={styles.footerDot('#3b82f6')}></span>
            <span style={styles.footerTag}>Farmer Verified</span>
          </div>
          <p style={styles.footerRight}>
            Manual Selection System v1.1 &nbsp;·&nbsp; Bulk Threshold: {thresholdKg} KG
          </p>
        </div>

      </div>
    </div>
  );
};

/* ─────────── Styles ─────────── */
const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 70, padding: 16,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 16,
    width: '100%', maxWidth: 1100,
    maxHeight: '92vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 32px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
  },

  /* Header */
  header: {
    padding: '20px 28px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fafafa',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon: {
    width: 38, height: 38,
    background: '#fef08a',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #fde047',
    flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' },
  headerSub: { margin: 0, fontSize: 12, color: '#6b7280', marginTop: 2 },
  closeBtn: {
    background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
    width: 34, height: 34, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6b7280', transition: 'all 0.15s',
  },

  /* Body */
  body: {
    flex: 1, display: 'flex', overflow: 'hidden',
  },

  /* Left Pane */
  leftPane: {
    flex: 1, padding: '24px 28px',
    borderRight: '1px solid #f3f4f6',
    overflowY: 'auto',
    background: '#fafafa',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center',
    fontSize: 11, fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  thresholdBadge: {
    fontSize: 10, fontWeight: 700,
    background: '#f3f4f6', color: '#374151',
    padding: '4px 10px', borderRadius: 20,
    border: '1px solid #e5e7eb',
    letterSpacing: '0.04em',
  },
  supplierList: { display: 'flex', flexDirection: 'column', gap: 12 },
  supplierCard: {
    width: '100%', textAlign: 'left',
    background: '#ffffff', borderRadius: 12,
    border: '1.5px solid #e5e7eb',
    padding: '18px 20px',
    cursor: 'pointer', position: 'relative',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  supplierCardSelected: {
    border: '1.5px solid #1d4ed8',
    boxShadow: '0 0 0 4px rgba(29,78,216,0.07), 0 4px 12px rgba(0,0,0,0.08)',
  },
  bestBadge: {
    position: 'absolute', top: -11, left: 16,
    background: '#111827', color: '#ffffff',
    fontSize: 10, fontWeight: 700,
    padding: '4px 10px', borderRadius: 20,
    display: 'flex', alignItems: 'center',
    letterSpacing: '0.04em',
  },
  supplierTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  supplierName: { margin: 0, fontWeight: 800, fontSize: 15, color: '#111827' },
  supplierStatus: { display: 'flex', alignItems: 'center', marginTop: 4 },
  supplierPrice: { margin: 0, fontWeight: 800, fontSize: 20, color: '#15803d' },
  supplierPriceLabel: { margin: 0, fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' },
  supplierMeta: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    background: '#f9fafb', borderRadius: 8, padding: '10px 14px',
    border: '1px solid #f3f4f6',
  },
  supplierMetaCell: { paddingRight: 16 },
  metaLabel: { margin: 0, fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  metaValue: { margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' },
  selectedIndicator: {
    marginTop: 14, paddingTop: 12, borderTop: '1px solid #eff6ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  emptySupplier: {
    padding: '48px 24px', textAlign: 'center',
    border: '2px dashed #e5e7eb', borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  savingsBanner: {
    marginTop: 20, padding: '16px 20px',
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
    display: 'flex', alignItems: 'flex-start', gap: 12,
  },
  savingsTitle: { margin: 0, fontWeight: 800, fontSize: 13, color: '#14532d' },
  savingsSub: { margin: 0, fontSize: 12, color: '#16a34a', marginTop: 2 },

  /* Right Pane */
  rightPane: {
    width: 440, padding: '24px 28px',
    overflowY: 'auto',
    background: '#ffffff',
  },
  rightContent: { display: 'flex', flexDirection: 'column', gap: 24 },
  weightBadge: {
    fontSize: 11, fontWeight: 700,
    padding: '4px 10px', borderRadius: 20,
  },
  variantList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 },
  variantRow: {
    background: '#fafafa',
    border: '1px solid #f3f4f6',
    borderRadius: 10, padding: '14px 16px',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gridTemplateRows: 'auto auto',
    rowGap: 10,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  variantName: { margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' },
  variantPrice: { margin: 0, fontSize: 11, color: '#6b7280', marginTop: 2 },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 7,
    border: '1px solid #e5e7eb',
    background: '#ffffff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#374151', transition: 'all 0.15s',
  },
  qtyBtnPlus: { background: '#1d4ed8', border: '1px solid #1d4ed8', color: '#ffffff' },
  qtyValue: { fontWeight: 800, fontSize: 15, color: '#111827', minWidth: 20, textAlign: 'center' },
  variantFooter: {
    gridColumn: '1 / -1',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTop: '1px solid #f3f4f6',
  },
  stockLabel: { fontSize: 10, color: '#9ca3af', fontWeight: 600 },
  variantSubtotal: { fontSize: 12, fontWeight: 800, color: '#1d4ed8' },
  totalSection: { marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' },
  totalLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  totalPriceBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
    padding: '14px 18px',
  },
  totalPriceLabel: { fontWeight: 700, fontSize: 11, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' },
  totalPriceValue: { fontWeight: 900, fontSize: 22, color: '#1d4ed8' },

  /* Inquiry */
  inquirySection: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: {
    width: '100%', padding: '14px 16px',
    background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: 10,
    outline: 'none', resize: 'none', minHeight: 110,
    fontWeight: 500, fontSize: 13, color: '#374151',
    fontFamily: 'inherit', lineHeight: 1.6,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },

  /* Actions */
  actions: { display: 'flex', flexDirection: 'column', gap: 8 },
  submitBtn: {
    width: '100%', padding: '14px',
    background: '#111827', color: '#ffffff',
    border: 'none', borderRadius: 10,
    fontWeight: 800, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(17,24,39,0.18)',
  },
  submitBtnDisabled: {
    background: '#e5e7eb', color: '#9ca3af',
    boxShadow: 'none', cursor: 'not-allowed',
  },
  cancelBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: '#9ca3af',
    padding: '8px', textAlign: 'center', transition: 'color 0.15s',
  },
  btnSpinner: {
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    animation: 'bom-spin 0.7s linear infinite',
    marginRight: 8,
  },

  /* Info note */
  infoNote: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
    padding: '12px 14px',
  },
  infoText: { margin: 0, fontSize: 11, fontWeight: 600, color: '#92400e', lineHeight: 1.6 },

  emptyRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px 20px',
  },

  /* Footer */
  footer: {
    padding: '12px 28px',
    background: '#111827',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid #1f2937',
  },
  footerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  footerDot: (color) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: color, display: 'inline-block',
    boxShadow: `0 0 6px ${color}`,
    animation: 'bom-pulse 2s ease-in-out infinite',
  }),
  footerTag: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  footerRight: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, margin: 0 },

  /* Loading */
  loadingCard: {
    background: '#ffffff', borderRadius: 16,
    padding: '48px 64px', textAlign: 'center',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
  },
  spinner: {
    width: 48, height: 48, margin: '0 auto 20px',
    borderRadius: '50%', border: '3px solid #f3f4f6',
    borderTopColor: '#111827',
    animation: 'bom-spin 0.8s linear infinite',
  },
  loadingText: { margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' },
};

const css = `
  @keyframes bom-spin { to { transform: rotate(360deg); } }
  @keyframes bom-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

  .bom-modal * { box-sizing: border-box; }

  .bom-close-btn:hover {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
    color: #111827 !important;
  }

  .bom-supplier-card:hover:not(.selected) {
    border-color: #93c5fd !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
    transform: translateY(-1px);
  }

  .bom-variant-row:hover {
    border-color: #bfdbfe !important;
    box-shadow: 0 2px 8px rgba(29,78,216,0.06) !important;
  }

  .bom-qty-btn:hover {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
  }

  .bom-qty-btn-plus:hover {
    background: #1e40af !important;
  }

  .bom-submit-btn:not(:disabled):hover {
    background: #1f2937 !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(17,24,39,0.28) !important;
  }

  .bom-submit-btn:not(:disabled):active {
    transform: translateY(0);
  }

  .bom-cancel-btn:hover {
    color: #374151 !important;
  }

  .bom-textarea:focus {
    border-color: #93c5fd !important;
    box-shadow: 0 0 0 3px rgba(147,197,253,0.25) !important;
    background: #ffffff !important;
  }

  /* ✅ MOBILE RESPONSIVENESS */
  @media (max-width: 768px) {
    .bom-modal {
      max-height: 100vh !important;
      height: 100vh !important;
      width: 100vw !important;
      max-width: 100vw !important;
      border-radius: 0 !important;
      margin: 0 !important;
    }
    
    .bom-modal > div:nth-child(2) {
      flex-direction: column !important;
      overflow-y: auto !important;
    }

    .bom-modal > div:nth-child(2) > div {
      width: 100% !important;
      flex: none !important;
      border-right: none !important;
      border-bottom: 1px solid #f3f4f6 !important;
      padding: 16px !important;
      height: auto !important;
      overflow-y: visible !important;
    }

    .bom-modal > div:nth-child(2) > div:last-child {
      border-bottom: none !important;
    }

    .bom-header {
      padding: 12px 16px !important;
    }

    .bom-header-title {
      font-size: 15px !important;
    }

    .bom-footer {
      padding: 12px 16px !important;
      flex-direction: column !important;
      gap: 8px !important;
      text-align: center !important;
    }
    
    .bom-footer-right {
      text-align: center !important;
    }

    .bom-variant-row {
      padding: 12px !important;
    }
    
    .bom-qty-btn {
      width: 44px !important;
      height: 44px !important;
    }
  }
`;

const spinnerCSS = `
  @keyframes bom-spin { to { transform: rotate(360deg); } }
`;

export default BulkOrderModal;
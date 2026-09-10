import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  DollarSign,
  TrendingUp,
  Package,
  User,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { ordersApi, paymentsApi } from '../api';
import type { Order, OrderStats, OrderStatus, PaymentStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Detail / Payment Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);
  const [paymentGatewayChoice, setPaymentGatewayChoice] = useState<'razorpay' | 'stripe'>('razorpay');

  // Manual payment recording
  const [isRecordingManual, setIsRecordingManual] = useState(false);
  const [manualRef, setManualRef] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersApi.list({
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        }),
        ordersApi.getStats().catch(() => null),
      ]);

      setOrders(ordersRes.orders || []);
      setTotal(ordersRes.total || 0);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, paymentStatusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, newPaymentStatus?: PaymentStatus) => {
    try {
      const res = await ordersApi.updateStatus(orderId, {
        status: newStatus,
        paymentStatus: newPaymentStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
      showToast(`Order status updated to ${newStatus}`, 'success');
      // Refresh stats
      ordersApi.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order status', 'error');
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!selectedOrder) return;
    setIsGeneratingPaymentLink(true);
    try {
      let link = '';
      if (paymentGatewayChoice === 'razorpay') {
        const res = await paymentsApi.createRazorpayLink({ orderId: selectedOrder.id });
        link = res.paymentLink;
      } else {
        const res = await paymentsApi.createStripeLink({ orderId: selectedOrder.id });
        link = res.paymentLink;
      }

      await ordersApi.setPaymentLink(selectedOrder.id, {
        paymentLink: link,
        paymentMethod: paymentGatewayChoice,
      });

      const updated = { ...selectedOrder, paymentLink: link, paymentMethod: paymentGatewayChoice };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));

      showToast(`Payment link generated via ${paymentGatewayChoice.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate payment link', 'error');
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  const handleRecordManualPayment = async () => {
    if (!selectedOrder) return;
    setIsRecordingManual(true);
    try {
      await paymentsApi.recordManualPayment({
        orderId: selectedOrder.id,
        amount: selectedOrder.totalAmount ?? selectedOrder.total_amount ?? 0,
        currency: selectedOrder.currency || 'INR',
        reference: manualRef || undefined,
      });

      const updatedRes = await ordersApi.get(selectedOrder.id);
      setSelectedOrder(updatedRes.order);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updatedRes.order : o)));
      showToast('Payment recorded manually & order marked as paid', 'success');
      setManualRef('');
      ordersApi.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err: any) {
      showToast(err?.message || 'Failed to record manual payment', 'error');
    } finally {
      setIsRecordingManual(false);
    }
  };

  const copyToClipboard = (text: string, label = 'Payment link') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'info');
  };

  const getOrderStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'shipped':
        return 'success';
      case 'processing':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'refunded':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'captured':
      case 'paid':
        return 'success';
      case 'authorized':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'refunded':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Orders & Invoices</h1>
              <p className="text-xs text-gray-500">
                Track WhatsApp cart checkouts, order lifecycles, and gateway transactions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-lg font-bold text-gray-900">{stats.totalOrders ?? 0}</h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-lg font-bold text-emerald-700">₹{(stats.totalRevenue ?? 0).toLocaleString()}</h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pending Orders</p>
              <h3 className="text-lg font-bold text-amber-700">{stats.pendingOrders ?? (stats as any).pendingCount ?? 0}</h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paid / Fulfilled</p>
              <h3 className="text-lg font-bold text-purple-700">
                {(stats.paidOrders ?? (stats as any).paidCount ?? 0) + (stats.completedOrders ?? (stats as any).completedCount ?? 0)}
              </h3>
            </div>
          </Card>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders by Order #, Contact name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Payment:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="captured">Captured / Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No orders found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When customers submit a cart order via WhatsApp catalog or payments are requested, orders will appear here.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {orders.map((order) => {
                  const ordNum = order.orderNumber || order.order_number || order.id.slice(0, 8);
                  const contactName = order.contactName || order.contact_name || 'Customer';
                  const contactExtId = order.contactExternalId || order.contact_external_id;
                  const totalAmt = order.totalAmount ?? order.total_amount ?? 0;
                  const payStatus = order.paymentStatus || order.payment_status || 'pending';
                  const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-gray-900 text-xs">{ordNum}</span>
                          <span className="text-[10px] text-gray-400">
                            {formatDateTime(order.createdAt || order.created_at)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{contactName}</span>
                          {contactExtId && (
                            <span className="text-[11px] text-gray-500 font-mono">{contactExtId}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-medium text-gray-800">
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">
                            {(order.items || []).map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">
                          {order.currency} {totalAmt.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={getOrderStatusBadgeVariant(order.status)} size="sm">
                          {order.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getPaymentStatusBadgeVariant(payStatus)} size="sm">
                            {payStatus.toUpperCase()}
                          </Badge>
                          {order.paymentMethod && (
                            <span className="text-[10px] font-mono text-gray-400">
                              ({order.paymentMethod})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                          icon={<ChevronRight className="w-4 h-4" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Order Details & Actions Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order ${selectedOrder.orderNumber || selectedOrder.order_number || selectedOrder.id.slice(0, 8)}`}
          description={`Placed on ${formatDateTime(selectedOrder.createdAt || selectedOrder.created_at)}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 pt-2">
            {/* Status & Summary Header */}
            <div className="p-3.5 bg-gray-50 rounded-xl flex flex-wrap items-center justify-between gap-3 border border-gray-200/60">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Lifecycle Status
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={getOrderStatusBadgeVariant(selectedOrder.status)} size="md">
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 font-medium text-gray-700 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pending">Mark Pending</option>
                    <option value="paid">Mark Paid</option>
                    <option value="processing">Mark Processing</option>
                    <option value="shipped">Mark Shipped</option>
                    <option value="completed">Mark Completed</option>
                    <option value="cancelled">Mark Cancelled</option>
                    <option value="refunded">Mark Refunded</option>
                  </select>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                  Total Payable
                </span>
                <span className="text-lg font-extrabold text-emerald-700">
                  {selectedOrder.currency} {(selectedOrder.totalAmount ?? selectedOrder.total_amount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 border border-gray-100 rounded-xl">
              <div>
                <span className="text-gray-400 font-medium">Customer:</span>{' '}
                <strong className="text-gray-800">
                  {selectedOrder.contactName || selectedOrder.contact_name || 'Anonymous Contact'}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Phone / External ID:</span>{' '}
                <strong className="font-mono text-gray-800">
                  {selectedOrder.contactExternalId || selectedOrder.contact_external_id || 'N/A'}
                </strong>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Order Items</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          SKU: {item.sku} &bull; Qty: {item.quantity} &times; {selectedOrder.currency} {(item.unitPrice ?? item.unit_price ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      {selectedOrder.currency} {item.total?.toLocaleString() || ((item.unitPrice ?? item.unit_price ?? 0) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Collection & Links */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Payment Gateway Link</h4>
                </div>
                <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus || selectedOrder.payment_status)} size="sm">
                  {(selectedOrder.paymentStatus || selectedOrder.payment_status || 'pending').toUpperCase()}
                </Badge>
              </div>

              {selectedOrder.paymentLink || selectedOrder.payment_link ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200 text-xs">
                    <input
                      type="text"
                      readOnly
                      value={selectedOrder.paymentLink || selectedOrder.payment_link || ''}
                      className="w-full font-mono text-emerald-900 bg-transparent border-none focus:outline-none select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedOrder.paymentLink || selectedOrder.payment_link || '')}
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors shrink-0"
                      title="Copy Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={selectedOrder.paymentLink || selectedOrder.payment_link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors shrink-0"
                      title="Open Payment Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <select
                    value={paymentGatewayChoice}
                    onChange={(e) => setPaymentGatewayChoice(e.target.value as 'razorpay' | 'stripe')}
                    className="text-xs bg-white border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="razorpay">Razorpay Standard Link</option>
                    <option value="stripe">Stripe Checkout Session</option>
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    isLoading={isGeneratingPaymentLink}
                    onClick={handleGeneratePaymentLink}
                    icon={<ArrowUpRight className="w-4 h-4" />}
                  >
                    Generate & Send Link
                  </Button>
                </div>
              )}

              {/* Manual Payment Option */}
              {selectedOrder.status !== 'paid' && selectedOrder.status !== 'completed' && (
                <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Manual payment ref / UPI transaction ID..."
                    value={manualRef}
                    onChange={(e) => setManualRef(e.target.value)}
                    className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex-1 focus:outline-none focus:border-emerald-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRecordingManual}
                    isLoading={isRecordingManual}
                    onClick={handleRecordManualPayment}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Record Manual Payment
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

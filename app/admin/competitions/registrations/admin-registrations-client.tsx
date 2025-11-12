'use client';

/**
 * Admin Registrations Client Component
 * Interactive dashboard for managing competition registrations with real-time updates
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Mail, 
  CheckCircle, 
  Clock,
  Users,
  DollarSign,
  FileText,
  Eye,
  Trash2,
  Send,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RevertPaymentDialog } from '@/components/ui/revert-payment-dialog';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { RejectPaymentDialog } from '@/components/ui/reject-payment-dialog';

interface Registration {
  id: string;
  registrationNumber: string;
  displayCode: string | null; // Anonymous code for public display
  status: string;
  submissionStatus: string;
  country: string;
  participantType: string; // INDIVIDUAL, TEAM, COMPANY, STUDENT, KIDS
  referralSource: string | null;
  teamName: string | null;
  companyName: string | null;
  businessRegistrationNo: string | null;
  teamMembers: any; // Team member names array
  members: any; // CRITICAL: All user-filled data (emails, phones, addresses, parent info)
  amountPaid: number;
  currency: string;
  registeredAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  submittedAt: string | null;
  submissionFiles: any;
  submissionNotes: string | null;
  submissionUrl: string | null;
  score: number | null;
  rank: number | null;
  award: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  competition: {
    id: string;
    slug: string;
    title: string;
    year: number;
    status: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
  };
  registrationType: {
    id: string;
    name: string;
    fee: number;
  };
  payment: {
    id: string;
    orderId: string;
    status: string;
    amount: number;
    paymentMethod: string;
    completedAt: string | null;
    metadata?: any;
  } | null;
}

interface Competition {
  id: string;
  slug: string;
  title: string;
  year: number;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  submitted: number;
  totalRevenue: number;
}

interface Props {
  registrations: Registration[];
  competitions: Competition[];
  stats: Stats;
}

export default function AdminRegistrationsClient({ registrations: initialRegistrations, competitions, stats: initialStats }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [competitionFilter, setCompetitionFilter] = useState<string>('ALL');
  const [submissionFilter, setSubmissionFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingRegistration, setViewingRegistration] = useState<Registration | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isRevertingPayment, setIsRevertingPayment] = useState(false);
  
  // Dialog states
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; registration: Registration | null }>({ type: '', registration: null });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/competitions/registrations');
      const data = await response.json();
      
      if (data.success && data.data) {
        setRegistrations(data.data.registrations);
        setStats(data.data.stats);
        toast.success('Data refreshed successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        reg.registrationNumber.toLowerCase().includes(searchLower) ||
        reg.user.name?.toLowerCase().includes(searchLower) ||
        reg.user.email.toLowerCase().includes(searchLower) ||
        reg.competition.title.toLowerCase().includes(searchLower) ||
        reg.country.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;

      // Competition filter
      const matchesCompetition = 
        competitionFilter === 'ALL' || reg.competition.id === competitionFilter;

      // Submission filter
      const matchesSubmission = 
        submissionFilter === 'ALL' || reg.submissionStatus === submissionFilter;

      // Payment method filter
      const matchesPaymentMethod = 
        paymentMethodFilter === 'ALL' || reg.payment?.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesCompetition && matchesSubmission && matchesPaymentMethod;
    });
  }, [registrations, searchQuery, statusFilter, competitionFilter, submissionFilter, paymentMethodFilter]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map(r => r.id));
    }
  };

  // Handle individual selection
  const handleSelect = (id: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = filteredRegistrations.map(reg => ({
      'Registration Number': reg.registrationNumber,
      'Display Code': reg.displayCode || 'N/A',
      'User Name': reg.user.name || 'N/A',
      'User Email': reg.user.email,
      'Competition': reg.competition.title,
      'Registration Type': reg.registrationType.name,
      'Status': reg.status,
      'Submission Status': reg.submissionStatus,
      'Amount Paid': reg.amountPaid,
      'Country': reg.country,
      'Payment Method': reg.payment?.paymentMethod || 'N/A',
      'Payment Status': reg.payment?.status || 'N/A',
      'Order ID': reg.payment?.orderId || 'N/A',
      'Registered Date': format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'NOT_SUBMITTED': return 'bg-gray-100 text-gray-600';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle send email - sends automatic templated email
  const handleSendEmail = async (registration: Registration) => {
    setIsSendingEmail(true);
    try {
      console.log('📧 Sending email to:', registration.user.email);
      
      const response = await fetch('/api/admin/send-registration-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registration.user.email,
          name: registration.user.name || 'User',
          registrationNumber: registration.registrationNumber,
          competitionTitle: registration.competition.title,
          status: registration.status,
          submissionStatus: registration.submissionStatus,
        }),
      });

      console.log('📬 Response status:', response.status);
      
      const data = await response.json();
      console.log('📬 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        toast.success(`Email sent successfully to ${registration.user.email}`);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      toast.error(`Failed to send email: ${errorMessage}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Open reject dialog
  const openRejectDialog = (registration: Registration) => {
    if (!registration.payment) {
      toast.error('No payment information found');
      return;
    }
    setPendingAction({ type: 'reject', registration });
    setShowRejectDialog(true);
  };

  // Verify bank transfer payment
  const handleVerifyPayment = async (approve: boolean, reason?: string) => {
    const registration = pendingAction.registration;
    if (!registration || !registration.payment) {
      toast.error('No payment information found');
      return;
    }

    setIsVerifyingPayment(true);
    try {
      const response = await fetch('/api/admin/competitions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: registration.payment.id,
          registrationId: registration.id,
          approve,
          rejectReason: !approve ? reason : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(approve ? 'Payment verified successfully!' : 'Payment rejected and user notified');
        
        // Refresh data
        await refreshData();
        
        // Close modal and dialog
        setViewingRegistration(null);
        setShowRejectDialog(false);
        setPendingAction({ type: '', registration: null });
      } else {
        toast.error(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Validate and format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string | null => {
    if (!phone) return null;
    
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits for international numbers)
    if (cleaned.length < 7 || cleaned.length > 15) {
      console.warn('Invalid phone number length:', phone);
      return null;
    }
    
    // If doesn't start with country code, assume Sri Lanka (+94)
    if (!cleaned.startsWith('94') && cleaned.length === 10) {
      cleaned = '94' + cleaned;
    }
    
    // Remove leading zeros after country code
    if (cleaned.startsWith('940')) {
      cleaned = '94' + cleaned.substring(3);
    }
    
    return cleaned;
  };

  // Bulk delete registrations
  const handleBulkDelete = async () => {
    console.log('Delete:', selectedRegistrations);
    toast.info('Delete feature coming soon');
    setShowDeleteDialog(false);
    // TODO: Implement bulk delete API endpoint
  };

  // Open revert dialog
  const openRevertDialog = (registration: Registration) => {
    if (!registration.payment) {
      toast.error('No payment information found');
      return;
    }
    setPendingAction({ type: 'revert', registration });
    setShowRevertDialog(true);
  };

  // Revert payment to PENDING
  const handleRevertPayment = async (reason: string) => {
    const registration = pendingAction.registration;
    if (!registration) return;

    setIsRevertingPayment(true);
    try {
      const response = await fetch('/api/admin/competitions/revert-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: registration.payment?.id,
          registrationId: registration.id,
          revertReason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment reverted to PENDING successfully!');
        
        // Refresh data
        await refreshData();
        
        // Close modal and dialog
        setViewingRegistration(null);
        setShowRevertDialog(false);
        setPendingAction({ type: '', registration: null });
      } else {
        toast.error(data.error || 'Failed to revert payment');
      }
    } catch (error) {
      console.error('Error reverting payment:', error);
      toast.error('Failed to revert payment');
    } finally {
      setIsRevertingPayment(false);
    }
  };

  return (
    <div className="mx-auto px-4 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Registrations</h1>
        <p className="text-gray-600">Manage all competition registrations and payments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-semibold text-green-600">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-orange-500">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Bank Transfers</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {registrations.filter(r => 
                  r.payment?.paymentMethod === 'BANK_TRANSFER' && 
                  r.payment?.status === 'PENDING'
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">PayHere</p>
              <p className="text-2xl font-semibold text-blue-600">
                {registrations.filter(r => 
                  r.payment?.paymentMethod === 'PAYHERE'
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.submitted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Total Revenue (LKR)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">PayHere Revenue (LKR)</p>
              <p className="text-2xl font-semibold text-blue-600">
                {registrations
                  .filter(r => r.payment?.paymentMethod === 'PAYHERE' && r.status === 'CONFIRMED')
                  .reduce((sum, r) => sum + r.amountPaid, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search registrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={filteredRegistrations.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-black text-white rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export
          </button>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-black text-white rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Methods</option>
              <option value="PAYHERE">PayHere</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Competition
            </label>
            <select
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Competitions</option>
              {competitions.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.title} ({comp.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Status
            </label>
            <select
              value={submissionFilter}
              onChange={(e) => setSubmissionFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedRegistrations.length > 0 && (
          <div className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-900">
                {selectedRegistrations.length} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    console.log('Send email to:', selectedRegistrations);
                    toast.info('Email feature coming soon');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button 
                  onClick={() => setShowDeleteDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count and Quick Filters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredRegistrations.length} of {registrations.length} registrations
        </div>
        
        {/* Quick Payment Method Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Quick Filter:</span>
          <button
            onClick={() => setPaymentMethodFilter('ALL')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              paymentMethodFilter === 'ALL'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setPaymentMethodFilter('PAYHERE')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              paymentMethodFilter === 'PAYHERE'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            PayHere Only ({registrations.filter(r => r.payment?.paymentMethod === 'PAYHERE').length})
          </button>
          <button
            onClick={() => setPaymentMethodFilter('BANK_TRANSFER')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              paymentMethodFilter === 'BANK_TRANSFER'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bank Transfer Only ({registrations.filter(r => r.payment?.paymentMethod === 'BANK_TRANSFER').length})
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Reg Info
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Competition
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No registrations found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.includes(reg.id)}
                        onChange={() => handleSelect(reg.id)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-gray-900 font-semibold">
                          #{reg.registrationNumber}
                        </div>
                        {reg.displayCode && (
                          <div className="text-xs font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200 inline-block">
                            🔒 {reg.displayCode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {reg.user.image ? (
                          <img
                            src={reg.user.image}
                            alt={reg.user.name || ''}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {reg.user.name?.charAt(0) || reg.user.email.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {reg.user.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{reg.user.email}</div>
                          <div className="text-xs text-gray-400">{reg.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {reg.competition.title}
                      </div>
                      <div className="text-sm text-gray-500">{reg.competition.year}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900">{reg.registrationType.name}</div>
                      {reg.teamName && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          🏆 {reg.teamName}
                        </div>
                      )}
                      {reg.companyName && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          🏢 {reg.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {/* Registration Status Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                          {reg.status.replace('_', ' ')}
                        </span>
                        
                        {/* Payment Method & Order ID */}
                        {reg.payment && (
                          <>
                            <div className={`text-xs font-medium ${
                              reg.payment.paymentMethod === 'PAYHERE' ? 'text-blue-600' : 'text-yellow-600'
                            }`}>
                              {reg.payment.paymentMethod === 'PAYHERE' ? '💳 PayHere' : '🏦 Bank Transfer'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {reg.payment.orderId}
                            </div>
                            
                            {/* Payment Status for PayHere */}
                            {reg.payment.paymentMethod === 'PAYHERE' && (
                              <div className={`text-xs font-semibold ${
                                reg.payment.status === 'COMPLETED' ? 'text-green-600' :
                                reg.payment.status === 'PENDING' ? 'text-yellow-600' :
                                reg.payment.status === 'FAILED' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {reg.payment.status === 'COMPLETED' ? '✓ Success' :
                                 reg.payment.status === 'PENDING' ? '⏳ Processing' :
                                 reg.payment.status === 'FAILED' ? '✗ Failed' : reg.payment.status}
                              </div>
                            )}
                            
                            {/* Bank Transfer Status */}
                            {reg.payment.paymentMethod === 'BANK_TRANSFER' && reg.payment.status === 'PENDING' && (
                              <div className="text-xs text-yellow-600 font-semibold">
                                ⏳ Awaiting Approval
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {reg.amountPaid.toLocaleString()}
                      </div>
                      {reg.payment && (
                        <div className="text-xs text-gray-500">{reg.payment.paymentMethod}</div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-xs text-gray-700">
                        {format(new Date(reg.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(reg.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setViewingRegistration(reg);
                          }}
                          className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleSendEmail(reg);
                          }}
                          disabled={isSendingEmail}
                          className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send Email"
                        >
                          <Send className={`w-5 h-5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
              <button
                onClick={() => setViewingRegistration(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Registration Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Registration Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="text-base font-medium text-gray-900 font-mono">{viewingRegistration.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Display Code (Public/Anonymous)</p>
                    {viewingRegistration.displayCode ? (
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-orange-600 font-mono bg-orange-50 px-3 py-1 rounded border border-orange-200">
                          {viewingRegistration.displayCode}
                        </p>
                        <span className="text-xs text-gray-500" title="This code is used for anonymous public display">
                          🔒
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not generated yet</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="text-base font-medium text-gray-900">{viewingRegistration.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingRegistration.status)}`}>
                      {viewingRegistration.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submission Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubmissionStatusColor(viewingRegistration.submissionStatus)}`}>
                      {viewingRegistration.submissionStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
                <div className="flex items-center gap-4 mb-4">
                  {viewingRegistration.user.image ? (
                    <img src={viewingRegistration.user.image} alt={viewingRegistration.user.name || ''} className="w-16 h-16 rounded-full" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-600">
                        {viewingRegistration.user.name?.charAt(0) || viewingRegistration.user.email.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-medium text-gray-900">{viewingRegistration.user.name || 'N/A'}</p>
                    <p className="text-base text-gray-600">{viewingRegistration.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Competition Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Competition Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Competition</p>
                    <p className="text-base font-medium text-gray-900">{viewingRegistration.competition.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="text-base font-medium text-gray-900">{viewingRegistration.competition.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Type</p>
                    <p className="text-base font-medium text-gray-900">{viewingRegistration.registrationType.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fee</p>
                    <p className="text-base font-medium text-gray-900">LKR {viewingRegistration.registrationType.fee.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Team/Company Info */}
              {(viewingRegistration.teamName || viewingRegistration.companyName) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {viewingRegistration.teamName ? 'Team Information' : 'Company Information'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingRegistration.teamName && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Team Name</p>
                          <p className="text-base font-medium text-gray-900">🏆 {viewingRegistration.teamName}</p>
                        </div>
                        {viewingRegistration.teamMembers && Array.isArray(viewingRegistration.teamMembers) && (
                          <div>
                            <p className="text-sm text-gray-600">Team Members</p>
                            <p className="text-base font-medium text-gray-900">{viewingRegistration.teamMembers.length} members</p>
                          </div>
                        )}
                      </>
                    )}
                    {viewingRegistration.companyName && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Company Name</p>
                          <p className="text-base font-medium text-gray-900">🏢 {viewingRegistration.companyName}</p>
                        </div>
                        {viewingRegistration.businessRegistrationNo && (
                          <div>
                            <p className="text-sm text-gray-600">Business Registration No</p>
                            <p className="text-base font-medium text-gray-900">{viewingRegistration.businessRegistrationNo}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* CRITICAL: Member Details - All User-Filled Data */}
              {viewingRegistration.members && (
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📋 Participant Details</span>
                    <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {viewingRegistration.participantType}
                    </span>
                  </h3>
                  
                  {(() => {
                    const members = Array.isArray(viewingRegistration.members) ? viewingRegistration.members : [];
                    
                    return members.map((member: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-4 mb-3 last:mb-0">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          {viewingRegistration.participantType === 'KIDS' ? '👶 Child Information' : 
                           viewingRegistration.participantType === 'TEAM' && index === 0 ? '👤 Team Leader' :
                           viewingRegistration.participantType === 'COMPANY' && index === 0 ? '👤 Company Representative' :
                           `👤 Member ${index + 1}`}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {/* Name */}
                          {member.name && (
                            <div>
                              <p className="text-gray-600">Full Name</p>
                              <p className="font-medium text-gray-900">{member.name}</p>
                            </div>
                          )}
                          {member.firstName && (
                            <>
                              <div>
                                <p className="text-gray-600">First Name</p>
                                <p className="font-medium text-gray-900">{member.firstName}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Last Name</p>
                                <p className="font-medium text-gray-900">{member.lastName || 'N/A'}</p>
                              </div>
                            </>
                          )}
                          
                          {/* Contact Info */}
                          {member.email && (
                            <div>
                              <p className="text-gray-600">📧 Email</p>
                              <p className="font-medium text-gray-900">{member.email}</p>
                            </div>
                          )}
                          {member.phone && (
                            <div>
                              <p className="text-gray-600">📱 Phone</p>
                              <p className="font-medium text-gray-900">{member.phone}</p>
                            </div>
                          )}
                          
                          {/* Student Specific */}
                          {member.dateOfBirth && (
                            <div>
                              <p className="text-gray-600">🎂 Date of Birth</p>
                              <p className="font-medium text-gray-900">{member.dateOfBirth}</p>
                            </div>
                          )}
                          {member.age && (
                            <div>
                              <p className="text-gray-600">Age</p>
                              <p className="font-medium text-gray-900">{member.age} years</p>
                            </div>
                          )}
                          {member.university && (
                            <div>
                              <p className="text-gray-600">🎓 University</p>
                              <p className="font-medium text-gray-900">{member.university}</p>
                            </div>
                          )}
                          {member.studentId && (
                            <div>
                              <p className="text-gray-600">Student ID</p>
                              <p className="font-medium text-gray-900">{member.studentId}</p>
                            </div>
                          )}
                          {member.studentIdCard && (
                            <div className="col-span-2">
                              <p className="text-gray-600 mb-1">Student ID Card</p>
                              <a href={member.studentIdCard} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-xs">
                                📎 View Uploaded Document
                              </a>
                            </div>
                          )}
                          {member.parentConsent !== undefined && (
                            <div>
                              <p className="text-gray-600">Parent Consent</p>
                              <p className={`font-medium ${member.parentConsent ? 'text-green-600' : 'text-red-600'}`}>
                                {member.parentConsent ? '✅ Provided' : '❌ Not Provided'}
                              </p>
                            </div>
                          )}
                          
                          {/* Kids Specific - Parent Information */}
                          {member.parentFirstName && (
                            <>
                              <div className="col-span-2 mt-3 pt-3 border-t border-gray-200">
                                <h5 className="font-semibold text-gray-900 mb-2">👨‍👩‍👧 Parent/Guardian Information</h5>
                              </div>
                              <div>
                                <p className="text-gray-600">Parent First Name</p>
                                <p className="font-medium text-gray-900">{member.parentFirstName}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Parent Last Name</p>
                                <p className="font-medium text-gray-900">{member.parentLastName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">📧 Parent Email</p>
                                <p className="font-medium text-gray-900">{member.parentEmail}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">📱 Parent Phone</p>
                                <p className="font-medium text-gray-900">{member.parentPhone}</p>
                              </div>
                            </>
                          )}
                          
                          {/* Address */}
                          {member.postalAddress && (
                            <div className="col-span-2">
                              <p className="text-gray-600">📍 Postal Address</p>
                              <p className="font-medium text-gray-900">{member.postalAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Payment Info */}
              {viewingRegistration.payment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    Payment Information
                    {viewingRegistration.payment.paymentMethod === 'PAYHERE' && (
                      <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        💳 PayHere Payment
                      </span>
                    )}
                    {viewingRegistration.payment.paymentMethod === 'BANK_TRANSFER' && (
                      <span className="text-sm font-medium bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        🏦 Bank Transfer
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="text-base font-medium text-gray-900">LKR {viewingRegistration.amountPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="text-base font-medium text-gray-900">{viewingRegistration.payment.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="text-base font-medium text-gray-900 font-mono">{viewingRegistration.payment.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        viewingRegistration.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        viewingRegistration.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        viewingRegistration.payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingRegistration.payment.status === 'COMPLETED' && '✓ '}
                        {viewingRegistration.payment.status === 'FAILED' && '✗ '}
                        {viewingRegistration.payment.status === 'PENDING' && '⏳ '}
                        {viewingRegistration.payment.status}
                      </span>
                    </div>
                    {viewingRegistration.payment.completedAt && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Payment Completed At</p>
                        <p className="text-base font-medium text-gray-900">
                          {format(new Date(viewingRegistration.payment.completedAt), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PayHere Specific Details */}
                  {viewingRegistration.payment.paymentMethod === 'PAYHERE' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-blue-600">💳</span> PayHere Transaction Details
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Transaction Status</p>
                            <p className={`font-bold text-base ${
                              viewingRegistration.payment.status === 'COMPLETED' ? 'text-green-600' :
                              viewingRegistration.payment.status === 'FAILED' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {viewingRegistration.payment.status === 'COMPLETED' && '✅ Payment Successful'}
                              {viewingRegistration.payment.status === 'FAILED' && '❌ Payment Failed'}
                              {viewingRegistration.payment.status === 'PENDING' && '⏳ Payment Processing'}
                              {!['COMPLETED', 'FAILED', 'PENDING'].includes(viewingRegistration.payment.status) && viewingRegistration.payment.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Order Reference</p>
                            <p className="font-medium text-gray-900 font-mono">{viewingRegistration.payment.orderId}</p>
                          </div>
                          {viewingRegistration.payment.metadata && (
                            <>
                              {(viewingRegistration.payment.metadata as any).payment_id && (
                                <div>
                                  <p className="text-gray-600">PayHere Payment ID</p>
                                  <p className="font-medium text-gray-900 font-mono">{(viewingRegistration.payment.metadata as any).payment_id}</p>
                                </div>
                              )}
                              {(viewingRegistration.payment.metadata as any).method && (
                                <div>
                                  <p className="text-gray-600">Payment Type</p>
                                  <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).method}</p>
                                </div>
                              )}
                              {(viewingRegistration.payment.metadata as any).card_holder_name && (
                                <div>
                                  <p className="text-gray-600">Card Holder</p>
                                  <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).card_holder_name}</p>
                                </div>
                              )}
                              {(viewingRegistration.payment.metadata as any).card_no && (
                                <div>
                                  <p className="text-gray-600">Card Number</p>
                                  <p className="font-medium text-gray-900 font-mono">{(viewingRegistration.payment.metadata as any).card_no}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Details from Payment Metadata */}
                  {viewingRegistration.payment.metadata && 
                   typeof viewingRegistration.payment.metadata === 'object' && 
                   'customerDetails' in viewingRegistration.payment.metadata && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Customer Contact Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {(viewingRegistration.payment.metadata as any).customerDetails.name && (
                          <div>
                            <p className="text-gray-600">Name</p>
                            <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).customerDetails.name}</p>
                          </div>
                        )}
                        {(viewingRegistration.payment.metadata as any).customerDetails.email && (
                          <div>
                            <p className="text-gray-600"> Email</p>
                            <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).customerDetails.email}</p>
                          </div>
                        )}
                        {(viewingRegistration.payment.metadata as any).customerDetails.phone && (
                          <div>
                            <p className="text-gray-600"> Phone</p>
                            <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).customerDetails.phone}</p>
                          </div>
                        )}
                        {(viewingRegistration.payment.metadata as any).customerDetails.address && (
                          <div>
                            <p className="text-gray-600"> Address</p>
                            <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).customerDetails.address}</p>
                          </div>
                        )}
                        {(viewingRegistration.payment.metadata as any).customerDetails.country && (
                          <div>
                            <p className="text-gray-600"> Country</p>
                            <p className="font-medium text-gray-900">{(viewingRegistration.payment.metadata as any).customerDetails.country}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail - Show verification/rejection history */}
                  {viewingRegistration.payment.metadata && 
                   ((viewingRegistration.payment.metadata as any).verifiedBy || 
                    (viewingRegistration.payment.metadata as any).revertedBy) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Audit Trail
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                        {/* Verification Info */}
                        {(viewingRegistration.payment.metadata as any).verifiedBy && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {(viewingRegistration.payment.metadata as any).action === 'APPROVED' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                              <span className="font-semibold text-gray-900">
                                {(viewingRegistration.payment.metadata as any).action === 'APPROVED' ? 'Approved' : 'Rejected'} by:
                              </span>
                              <span className="text-gray-700">
                                {(viewingRegistration.payment.metadata as any).verifiedByName || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-gray-600 ml-6">
                              📧 {(viewingRegistration.payment.metadata as any).verifiedBy}
                            </p>
                            {(viewingRegistration.payment.metadata as any).verifiedAt && (
                              <p className="text-gray-600 ml-6">
                                🕒 {format(new Date((viewingRegistration.payment.metadata as any).verifiedAt), 'MMM dd, yyyy HH:mm:ss')}
                              </p>
                            )}
                            {(viewingRegistration.payment.metadata as any).rejectReason && (
                              <div className="ml-6 mt-2 bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs font-medium text-red-900 mb-1">Rejection Reason:</p>
                                <p className="text-sm text-red-800">{(viewingRegistration.payment.metadata as any).rejectReason}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Revert Info */}
                        {(viewingRegistration.payment.metadata as any).revertedBy && (
                          <div className="space-y-1 mt-3 pt-3 border-t border-gray-300">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
                              </svg>
                              <span className="font-semibold text-gray-900">Reverted by:</span>
                              <span className="text-gray-700">
                                {(viewingRegistration.payment.metadata as any).revertedByName || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-gray-600 ml-6">
                              📧 {(viewingRegistration.payment.metadata as any).revertedBy}
                            </p>
                            {(viewingRegistration.payment.metadata as any).revertedAt && (
                              <p className="text-gray-600 ml-6">
                                🕒 {format(new Date((viewingRegistration.payment.metadata as any).revertedAt), 'MMM dd, yyyy HH:mm:ss')}
                              </p>
                            )}
                            {(viewingRegistration.payment.metadata as any).previousStatus && (
                              <p className="text-gray-600 ml-6">
                                📝 Previous Status: <span className="font-medium">{(viewingRegistration.payment.metadata as any).previousStatus}</span>
                              </p>
                            )}
                            {(viewingRegistration.payment.metadata as any).revertReason && (
                              <div className="ml-6 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
                                <p className="text-xs font-medium text-amber-900 mb-1">Revert Reason:</p>
                                <p className="text-sm text-amber-800">{(viewingRegistration.payment.metadata as any).revertReason}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Section */}
                  {viewingRegistration.payment.paymentMethod === 'BANK_TRANSFER' && 
                   viewingRegistration.payment.metadata && 
                   typeof viewingRegistration.payment.metadata === 'object' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* WhatsApp-Only (No Upload) - Most Prominent */}
                      {(viewingRegistration.payment.metadata as any).willSendViaWhatsApp && 
                       !('bankSlipUrl' in viewingRegistration.payment.metadata) && (
                        <div className="mb-3 bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">⚠️</span>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                                <span>NO BANK SLIP UPLOADED</span>
                                <span className="text-xs font-medium bg-amber-200 text-amber-800 px-2 py-1 rounded">WhatsApp Only</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-amber-900 font-medium text-base">
                                  ⚠️ Customer chose to send bank slip via WhatsApp instead of uploading
                                </p>
                                <div className="bg-white border border-amber-300 rounded p-3 mt-3">
                                  <p className="text-amber-900 font-semibold mb-2">📱 Contact Details:</p>
                                  {(viewingRegistration.payment.metadata as any).customerDetails?.phone && (() => {
                                    const rawPhone = (viewingRegistration.payment.metadata as any).customerDetails.phone;
                                    const formattedPhone = formatPhoneForWhatsApp(rawPhone);
                                    return (
                                      <p className="text-amber-900 mb-1">
                                        <span className="font-medium">Phone:</span>{' '}
                                        {formattedPhone ? (
                                          <a 
                                            href={`https://wa.me/${formattedPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 underline font-bold"
                                          >
                                            {rawPhone} (Click to open WhatsApp)
                                          </a>
                                        ) : (
                                          <span className="text-gray-700">
                                            {rawPhone} <span className="text-xs text-red-600">(Invalid phone format)</span>
                                          </span>
                                        )}
                                      </p>
                                    );
                                  })()}
                                  {(viewingRegistration.payment.metadata as any).customerDetails?.email && (
                                    <p className="text-amber-900">
                                      <span className="font-medium">Email:</span>{' '}
                                      <a 
                                        href={`mailto:${(viewingRegistration.payment.metadata as any).customerDetails.email}`}
                                        className="text-blue-600 hover:text-blue-700 underline"
                                      >
                                        {(viewingRegistration.payment.metadata as any).customerDetails.email}
                                      </a>
                                    </p>
                                  )}
                                </div>
                                <div className="bg-green-100 border border-green-300 rounded p-3 mt-2">
                                  <p className="text-green-900 font-semibold mb-1">✅ Action Required:</p>
                                  <p className="text-green-800">Check your WhatsApp messages for the bank slip from this customer</p>
                                  {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (() => {
                                    const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
                                    const formattedAdminPhone = formatPhoneForWhatsApp(adminPhone);
                                    return (
                                      <p className="text-green-900 mt-2">
                                        <span className="font-medium">Your WhatsApp:</span>{' '}
                                        {formattedAdminPhone ? (
                                          <a 
                                            href={`https://wa.me/${formattedAdminPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 underline font-bold"
                                          >
                                            {adminPhone} (Click to open)
                                          </a>
                                        ) : (
                                          <span className="text-gray-700">
                                            {adminPhone} <span className="text-xs text-red-600">(Invalid phone format)</span>
                                          </span>
                                        )}
                                      </p>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp + Upload (Both methods) */}
                      {(viewingRegistration.payment.metadata as any).willSendViaWhatsApp && 
                       (viewingRegistration.payment.metadata as any).bankSlipUrl && (
                        <div className="mb-3 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">💬</span>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-blue-900 mb-1">Slip Uploaded + WhatsApp</h4>
                              <p className="text-blue-800 text-sm">
                                Customer uploaded slip below AND will also send via WhatsApp
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No Slip Uploaded at All (not WhatsApp-only, just nothing) */}
                      {!(viewingRegistration.payment.metadata as any).bankSlipUrl && 
                       !(viewingRegistration.payment.metadata as any).willSendViaWhatsApp && (
                        <div className="mb-3 bg-red-50 border-2 border-red-400 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">❌</span>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-red-900 mb-2">NO BANK SLIP UPLOADED</h4>
                              <p className="text-red-800 font-medium">
                                ⚠️ Customer has not uploaded bank slip and did not select WhatsApp option
                              </p>
                              <div className="bg-white border border-red-300 rounded p-3 mt-3">
                                <p className="text-red-900 font-semibold mb-2">🔍 Possible Actions:</p>
                                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                  <li>Contact customer via phone/email to request bank slip</li>
                                  <li>Check if slip was sent through other channels</li>
                                  <li>Verify payment received in bank account before approving</li>
                                </ul>
                                {(viewingRegistration.payment.metadata as any).customerDetails?.phone && (
                                  <div className="mt-2 pt-2 border-t border-red-200">
                                    <p className="text-red-900 text-sm">
                                      <span className="font-medium">📱 Phone:</span>{' '}
                                      {(viewingRegistration.payment.metadata as any).customerDetails.phone}
                                    </p>
                                  </div>
                                )}
                                {(viewingRegistration.payment.metadata as any).customerDetails?.email && (
                                  <div className="mt-1">
                                    <p className="text-red-900 text-sm">
                                      <span className="font-medium">📧 Email:</span>{' '}
                                      <a 
                                        href={`mailto:${(viewingRegistration.payment.metadata as any).customerDetails.email}`}
                                        className="text-blue-600 hover:text-blue-700 underline"
                                      >
                                        {(viewingRegistration.payment.metadata as any).customerDetails.email}
                                      </a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bank Slip if uploaded */}
                      {(viewingRegistration.payment.metadata as any).bankSlipUrl && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-semibold text-gray-900">Bank Transfer Slip</h4>
                        {viewingRegistration.payment.status === 'PENDING' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Awaiting Verification
                          </span>
                        )}
                      </div>
                      
                      {/* Bank Slip Image */}
                      <div className="mb-4">
                        <a 
                          href={(viewingRegistration.payment.metadata as any).bankSlipUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block border-2 border-gray-200 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
                        >
                          <img 
                            src={(viewingRegistration.payment.metadata as any).bankSlipUrl} 
                            alt="Bank Transfer Slip" 
                            className="w-full h-auto max-h-96 object-contain bg-gray-50"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex flex-col items-center justify-center p-8 bg-gray-50">
                                    <svg class="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-sm text-gray-600">Click to view document</p>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                          File: {(viewingRegistration.payment.metadata as any).bankSlipFileName || 'bank-slip'}
                        </p>
                      </div>

                      {/* Verification Buttons */}
                      {viewingRegistration.payment.status === 'PENDING' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setPendingAction({ type: 'approve', registration: viewingRegistration });
                              handleVerifyPayment(true);
                            }}
                            disabled={isVerifyingPayment}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className={`w-5 h-5 ${isVerifyingPayment ? 'animate-pulse' : ''}`} />
                            {isVerifyingPayment ? 'Verifying...' : 'Approve Payment'}
                          </button>
                          <button
                            onClick={() => openRejectDialog(viewingRegistration)}
                            disabled={isVerifyingPayment}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-5 h-5" />
                            Reject Payment
                          </button>
                        </div>
                      )}

                      {viewingRegistration.payment.status === 'COMPLETED' && (
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Payment Verified and Approved</span>
                            </div>
                          </div>
                          <button
                            onClick={() => openRevertDialog(viewingRegistration)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Revert to Pending
                          </button>
                          <p className="text-xs text-amber-700 text-center">
                            ⚠️ This will undo the approval and reset payment to pending status. Display code will be kept for tracking.
                          </p>
                        </div>
                      )}

                      {viewingRegistration.payment.status === 'FAILED' && (
                        <div className="space-y-3">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <X className="w-5 h-5" />
                              <span className="text-sm font-medium">Payment Rejected</span>
                            </div>
                          </div>
                          <button
                            onClick={() => openRevertDialog(viewingRegistration)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Revert to Pending
                          </button>
                          <p className="text-xs text-amber-700 text-center">
                            ⚠️ This will allow the customer to resubmit their payment. Previous rejection will be recorded in audit trail.
                          </p>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="text-base font-medium text-gray-900">
                      {format(new Date(viewingRegistration.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {viewingRegistration.confirmedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Confirmed At</p>
                      <p className="text-base font-medium text-green-600">
                        {format(new Date(viewingRegistration.confirmedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                  {viewingRegistration.submittedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Submitted At</p>
                      <p className="text-base font-medium text-blue-600">
                        {format(new Date(viewingRegistration.submittedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await handleSendEmail(viewingRegistration);
                    setViewingRegistration(null);
                  }}
                  disabled={isSendingEmail}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className={`w-5 h-5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                  {isSendingEmail ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  onClick={() => setViewingRegistration(null)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revert Payment Dialog */}
      <RevertPaymentDialog
        isOpen={showRevertDialog}
        onClose={() => {
          setShowRevertDialog(false);
          setPendingAction({ type: '', registration: null });
        }}
        onConfirm={handleRevertPayment}
        isLoading={isRevertingPayment}
        registrationNumber={pendingAction.registration?.registrationNumber}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        count={selectedRegistrations.length}
      />

      {/* Reject Payment Dialog */}
      <RejectPaymentDialog
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setPendingAction({ type: '', registration: null });
        }}
        onConfirm={(reason) => handleVerifyPayment(false, reason)}
        isLoading={isVerifyingPayment}
        registrationNumber={pendingAction.registration?.registrationNumber}
        customerName={pendingAction.registration?.user?.name || 'Customer'}
      />

    </div>
  );
}

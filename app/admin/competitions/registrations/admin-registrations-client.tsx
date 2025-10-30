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

interface Registration {
  id: string;
  registrationNumber: string;
  displayCode: string | null; // Anonymous code for public display
  status: string;
  submissionStatus: string;
  country: string;
  teamName: string | null;
  companyName: string | null;
  businessRegistrationNo: string | null;
  teamMembers: any;
  amountPaid: number;
  createdAt: string;
  confirmedAt: string | null;
  submittedAt: string | null;
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
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingRegistration, setViewingRegistration] = useState<Registration | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

      return matchesSearch && matchesStatus && matchesCompetition && matchesSubmission;
    });
  }, [registrations, searchQuery, statusFilter, competitionFilter, submissionFilter]);

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

  // Verify bank transfer payment
  const handleVerifyPayment = async (registration: Registration, approve: boolean) => {
    if (!registration.payment) {
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(approve ? 'Payment verified successfully!' : 'Payment rejected');
        
        // Refresh data
        await refreshData();
        
        // Close modal
        setViewingRegistration(null);
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
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.submitted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Revenue (LKR)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalRevenue.toLocaleString()}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              Submission
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
                  onClick={() => {
                    if (confirm(`Delete ${selectedRegistrations.length} registration(s)?`)) {
                      console.log('Delete:', selectedRegistrations);
                      toast.info('Delete feature coming soon');
                    }
                  }}
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

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
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
                  User
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Competition
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Status
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
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                        {reg.status.replace('_', ' ')}
                      </span>
                      <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubmissionStatusColor(reg.submissionStatus)}`}>
                        {reg.submissionStatus.replace('_', ' ').substring(0, 10)}
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

              {/* Payment Info */}
              {viewingRegistration.payment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
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
                      <p className="text-base font-medium text-gray-900">{viewingRegistration.payment.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingRegistration.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        viewingRegistration.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewingRegistration.payment.status}
                      </span>
                    </div>
                  </div>

                  {/* Bank Transfer Section */}
                  {viewingRegistration.payment.paymentMethod === 'BANK_TRANSFER' && 
                   viewingRegistration.payment.metadata && 
                   typeof viewingRegistration.payment.metadata === 'object' && 
                   'bankSlipUrl' in viewingRegistration.payment.metadata && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
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
                            onClick={() => handleVerifyPayment(viewingRegistration, true)}
                            disabled={isVerifyingPayment}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className={`w-5 h-5 ${isVerifyingPayment ? 'animate-pulse' : ''}`} />
                            {isVerifyingPayment ? 'Verifying...' : 'Approve Payment'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to reject this payment?')) {
                                handleVerifyPayment(viewingRegistration, false);
                              }
                            }}
                            disabled={isVerifyingPayment}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-5 h-5" />
                            Reject Payment
                          </button>
                        </div>
                      )}

                      {viewingRegistration.payment.status === 'COMPLETED' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Payment Verified and Approved</span>
                          </div>
                        </div>
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

    </div>
  );
}

'use client';

/**
 * Admin Registrations Client Component
 * Interactive dashboard for managing competition registrations
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Mail, 
  CheckCircle, 
  Clock,
  Users,
  DollarSign,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';

interface Registration {
  id: string;
  registrationNumber: string;
  status: string;
  submissionStatus: string;
  country: string;
  teamMembers: any;
  amountPaid: number;
  createdAt: string;
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

export default function AdminRegistrationsClient({ registrations, competitions, stats }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [competitionFilter, setCompetitionFilter] = useState<string>('ALL');
  const [submissionFilter, setSubmissionFilter] = useState<string>('ALL');
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Registrations</h1>
        <p className="text-gray-600">Manage all competition registrations and payments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.submitted}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-[#FACC15] mt-1">
                {stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">LKR</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-[#FACC15]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by registration number, user, competition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] focus:border-transparent"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-black font-medium rounded-lg hover:bg-[#F59E0B] transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending Payment</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Competition
            </label>
            <select
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Status
            </label>
            <select
              value={submissionFilter}
              onChange={(e) => setSubmissionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] focus:border-transparent"
            >
              <option value="ALL">All Submissions</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedRegistrations.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedRegistrations.length} registration(s) selected
              </span>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-blue-700 text-sm font-medium rounded-md hover:bg-blue-50 border border-blue-300">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-red-700 text-sm font-medium rounded-md hover:bg-red-50 border border-red-300">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#FACC15] focus:ring-[#FACC15]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competition
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No registrations found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.includes(reg.id)}
                        onChange={() => handleSelect(reg.id)}
                        className="rounded border-gray-300 text-[#FACC15] focus:ring-[#FACC15]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {reg.registrationNumber}
                      </div>
                      <div className="text-xs text-gray-500">{reg.country}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {reg.user.image ? (
                          <img
                            src={reg.user.image}
                            alt={reg.user.name || ''}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {reg.user.name?.charAt(0) || reg.user.email.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reg.user.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">{reg.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {reg.competition.title}
                      </div>
                      <div className="text-xs text-gray-500">{reg.competition.year}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{reg.registrationType.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                        {reg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubmissionStatusColor(reg.submissionStatus)}`}>
                        {reg.submissionStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        LKR {reg.amountPaid.toLocaleString()}
                      </div>
                      {reg.payment && (
                        <div className="text-xs text-gray-500">{reg.payment.paymentMethod}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(reg.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(reg.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-[#FACC15] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Send Email"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4" />
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
    </div>
  );
}

/**
 * Registration Form Component
 * Multi-step form for competition registration
 */

'use client';

import { useState } from 'react';
import { Competition, CompetitionRegistrationType } from '@prisma/client';
import { MemberInfo, AgreementData, AddToCartData } from '@/types/competition';
import { toast } from 'sonner';

interface Props {
  competition: Competition;
  registrationTypes: CompetitionRegistrationType[];
  onCartUpdate: () => void;
  user: any;
}

export default function RegistrationForm({
  competition,
  registrationTypes,
  onCartUpdate,
  user,
}: Props) {
  const [selectedType, setSelectedType] = useState<CompetitionRegistrationType | null>(null);
  const [country, setCountry] = useState('Sri Lanka');
  const [referralSource, setReferralSource] = useState('');
  
  // Split user name into first and last name
  const userName = user?.name || '';
  const nameParts = userName.split(' ');
  const userFirstName = nameParts[0] || '';
  const userLastName = nameParts.slice(1).join(' ') || '';
  
  const [members, setMembers] = useState<MemberInfo[]>([
    { 
      name: userName, 
      firstName: userFirstName,
      lastName: userLastName,
      email: user?.email || '' 
    },
  ]);
  const [agreements, setAgreements] = useState<AgreementData>({
    agreedToTerms: false,
    agreedToWebsiteTerms: false,
    agreedToPrivacyPolicy: false,
    agreedToRefundPolicy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = () => {
    if (!selectedType || members.length >= selectedType.maxMembers) {
      toast.error(`Maximum ${selectedType?.maxMembers} member(s) allowed`);
      return;
    }
    setMembers([...members, { name: '', firstName: '', lastName: '', email: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length === 1) {
      toast.error('At least one member is required');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberInfo, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error('Please select a registration type');
      return;
    }

    // Validate all agreements
    if (
      !agreements.agreedToTerms ||
      !agreements.agreedToWebsiteTerms ||
      !agreements.agreedToPrivacyPolicy ||
      !agreements.agreedToRefundPolicy
    ) {
      toast.error('Please agree to all terms and conditions');
      return;
    }

    // Validate referral source is required
    if (!referralSource || referralSource.trim() === '') {
      toast.error('Please select where you heard about us');
      return;
    }

    // Validate members
    for (const member of members) {
      if (!member.firstName || !member.firstName.trim()) {
        toast.error('Please enter first name for all members');
        return;
      }
      if (!member.lastName || !member.lastName.trim()) {
        toast.error('Please enter last name for all members');
        return;
      }
      if (!member.email || !member.email.trim()) {
        toast.error('Please enter email for all members');
        return;
      }
      if (!member.phone || !member.phone.trim()) {
        toast.error('Please enter mobile number for all members');
        return;
      }
      
      // Validate student fields if student type
      if (selectedType.type === 'STUDENT') {
        if (!member.studentId || !member.studentId.trim()) {
          toast.error('Please enter student ID for all members');
          return;
        }
        if (!member.institution || !member.institution.trim()) {
          toast.error('Please enter institution for all members');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const data: AddToCartData = {
        competitionId: competition.id,
        registrationTypeId: selectedType.id,
        country,
        participantType: selectedType.type,
        referralSource: referralSource || undefined,
        members,
        agreements,
      };

      console.log('Sending data to cart API:', JSON.stringify(data, null, 2));

      const response = await fetch('/api/competitions/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      console.log('Cart API response:', result);

      if (result.success) {
        toast.success('Added to cart successfully!');
        onCartUpdate();
        // Reset form
        setSelectedType(null);
        setMembers([{ 
          name: userName, 
          firstName: userFirstName,
          lastName: userLastName,
          email: user?.email || '' 
        }]);
        setAgreements({
          agreedToTerms: false,
          agreedToWebsiteTerms: false,
          agreedToPrivacyPolicy: false,
          agreedToRefundPolicy: false,
        });
      } else {
        toast.error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Add New Registration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Registration Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {registrationTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedType?.id === type.id
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="registrationType"
                  checked={selectedType?.id === type.id}
                  onChange={() => {
                    setSelectedType(type);
                    // Reset members if changing type
                    if (type.maxMembers < members.length) {
                      setMembers([members[0]]);
                    }
                  }}
                  className="w-4 h-4 text-yellow-400 border-gray-300 focus:ring-yellow-400"
                />
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedType && (
          <>
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              >
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Member Information */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {selectedType.type === 'INDIVIDUAL' ? 'Personal Information' : 'Member Information'} <span className="text-red-500">*</span>
                </label>
                {members.length < selectedType.maxMembers && selectedType.type !== 'INDIVIDUAL' && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    + Add Member
                  </button>
                )}
              </div>

              {members.map((member, index) => (
                <div key={index} className="mb-4">
                  {selectedType.type !== 'INDIVIDUAL' && (
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Member {index + 1}
                        {index === 0 && ' (Lead)'}
                      </h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={member.firstName || ''}
                        onChange={(e) => {
                          handleMemberChange(index, 'firstName', e.target.value);
                          // Update full name
                          const lastName = member.lastName || '';
                          handleMemberChange(index, 'name', `${e.target.value} ${lastName}`.trim());
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={member.lastName || ''}
                        onChange={(e) => {
                          handleMemberChange(index, 'lastName', e.target.value);
                          // Update full name
                          const firstName = member.firstName || '';
                          handleMemberChange(index, 'name', `${firstName} ${e.target.value}`.trim());
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={member.phone || ''}
                        onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        required
                      />
                    </div>

                    {selectedType.type === 'STUDENT' && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Student ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.studentId || ''}
                            onChange={(e) => handleMemberChange(index, 'studentId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Institution <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.institution || ''}
                            onChange={(e) => handleMemberChange(index, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Referral Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where did you hear about us? <span className="text-red-500">*</span>
              </label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              >
                <option value="">Select an option</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Google">Google</option>
                <option value="YouTube">YouTube</option>
                <option value="Pinterest">Pinterest</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email">Email</option>
                <option value="Friend or Family">Friend or Family</option>
              </select>
            </div>

            {/* Agreements */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Please check the boxes below to proceed <span className="text-red-500">*</span>
              </p>

              {[
                { key: 'agreedToTerms', label: 'I agree to the Competition Terms and Conditions' },
                { key: 'agreedToWebsiteTerms', label: "I agree to the Website's Terms and Conditions" },
                { key: 'agreedToPrivacyPolicy', label: "I agree to the Website's Privacy Policy" },
                { key: 'agreedToRefundPolicy', label: 'I agree to the Refund Policy' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements[key as keyof AgreementData]}
                    onChange={(e) =>
                      setAgreements({ ...agreements, [key]: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    required
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : '+ Add to Cart'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

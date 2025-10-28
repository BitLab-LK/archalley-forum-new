/**
 * Registration Form Component
 * Multi-step form for competition registration
 */

'use client';

import { useState, useEffect } from 'react';
import { Competition, CompetitionRegistrationType } from '@prisma/client';
import { MemberInfo, AgreementData } from '@/types/competition';
import { toast } from 'sonner';

interface Props {
  competition: Competition;
  registrationTypes: CompetitionRegistrationType[];
  onCartUpdate: () => void;
  editingItem?: any; // Cart item being edited
  onEditComplete?: () => void; // Callback when edit is done
}

export default function RegistrationForm({
  competition,
  registrationTypes,
  onCartUpdate,
  editingItem,
  onEditComplete,
}: Props) {
  // Initialize with empty values - useEffect will handle editingItem
  const [selectedType, setSelectedType] = useState<CompetitionRegistrationType | null>(null);
  const [country, setCountry] = useState('Sri Lanka');
  const [referralSource, setReferralSource] = useState('');
  const [teamName, setTeamName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessRegistrationNo, setBusinessRegistrationNo] = useState('');
  const [members, setMembers] = useState<MemberInfo[]>([
    { name: '', firstName: '', lastName: '', email: '' }
  ]);
  const [teamMembers, setTeamMembers] = useState<string[]>(['']); // For team member names only
  const [uploadingFiles, setUploadingFiles] = useState<{[key: number]: boolean}>({});
  const [agreements, setAgreements] = useState<AgreementData>({
    agreedToTerms: false,
    agreedToWebsiteTerms: false,
    agreedToPrivacyPolicy: false,
    agreedToRefundPolicy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(editingItem?.id || null);

  // Update form when editingItem changes - only run when editingItem.id changes
  useEffect(() => {
    if (editingItem) {
      // Pre-fill form with editing data
      const regType = registrationTypes.find(t => t.id === editingItem.registrationTypeId) || null;
      setSelectedType(regType);
      setCountry(editingItem.country || 'Sri Lanka');
      setReferralSource(editingItem.referralSource || '');
      setTeamName(editingItem.teamName || '');
      setCompanyName(editingItem.companyName || '');
      setBusinessRegistrationNo(editingItem.businessRegistrationNo || '');
      setEditItemId(editingItem.id);
      
      if (Array.isArray(editingItem.members)) {
        setMembers(editingItem.members.map((m: any) => ({
          name: m.name || '',
          firstName: m.firstName || m.name?.split(' ')[0] || '',
          lastName: m.lastName || m.name?.split(' ').slice(1).join(' ') || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || '',
          studentId: m.studentId || '',
          institution: m.institution || '',
        })));
      }
      
      if (Array.isArray(editingItem.teamMembers)) {
        setTeamMembers(editingItem.teamMembers);
      }
    } else {
      // Reset to empty form for new registration
      setSelectedType(null);
      setCountry('Sri Lanka');
      setReferralSource('');
      setTeamName('');
      setCompanyName('');
      setBusinessRegistrationNo('');
      setMembers([{ name: '', firstName: '', lastName: '', email: '' }]);
      setTeamMembers(['']);
      setAgreements({
        agreedToTerms: false,
        agreedToWebsiteTerms: false,
        agreedToPrivacyPolicy: false,
        agreedToRefundPolicy: false,
      });
      setEditItemId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem?.id]);

  const handleAddMember = () => {
    if (!selectedType || members.length >= selectedType.maxMembers) {
      toast.error(`Maximum ${selectedType?.maxMembers} member(s) allowed`);
      return;
    }
    setMembers([...members, { name: '', firstName: '', lastName: '', email: '' }]);
  };

  const handleMemberChange = (index: number, field: keyof MemberInfo, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  // Handle student ID card file upload
  const handleFileUpload = async (index: number, file: File) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [index]: true }));

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/student-id', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update member with file info and uploaded URL
        const newMembers = [...members];
        newMembers[index] = {
          ...newMembers[index],
          idCardFile: file.name,
          idCardUrl: result.data.url,
        };
        setMembers(newMembers);
        toast.success('File uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('An error occurred while uploading the file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [index]: false }));
    }
  };

  // Team member handlers
  const handleAddTeamMember = () => {
    if (teamMembers.length >= 10) {
      toast.error('Maximum 10 members allowed');
      return;
    }
    setTeamMembers([...teamMembers, '']);
  };

  const handleRemoveTeamMember = (index: number) => {
    if (teamMembers.length === 1) {
      toast.error('At least one member is required');
      return;
    }
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleTeamMemberChange = (index: number, value: string) => {
    const newTeamMembers = [...teamMembers];
    newTeamMembers[index] = value;
    setTeamMembers(newTeamMembers);
  };

  // Check if selected type is a team registration
  const isTeamRegistration = selectedType?.type === 'TEAM';
  const isCompanyRegistration = selectedType?.type === 'COMPANY';
  const isKidsRegistration = selectedType?.type === 'KIDS';

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

    // Different validation for team vs company vs individual/student
    if (isTeamRegistration) {
      // Validate team name
      if (!teamName || !teamName.trim()) {
        toast.error('Please enter team name');
        return;
      }

      // Validate team representative (first member)
      const representative = members[0];
      if (!representative.firstName || !representative.firstName.trim()) {
        toast.error('Please enter team representative first name');
        return;
      }
      if (!representative.lastName || !representative.lastName.trim()) {
        toast.error('Please enter team representative last name');
        return;
      }
      if (!representative.email || !representative.email.trim()) {
        toast.error('Please enter team representative email');
        return;
      }
      if (!representative.phone || !representative.phone.trim()) {
        toast.error('Please enter team representative contact number');
        return;
      }

      // Validate team members
      for (let i = 0; i < teamMembers.length; i++) {
        if (!teamMembers[i] || !teamMembers[i].trim()) {
          toast.error(`Please enter name for team member ${i + 1}`);
          return;
        }
      }
    } else if (isCompanyRegistration) {
      // Validate company name
      if (!companyName || !companyName.trim()) {
        toast.error('Please enter company name');
        return;
      }

      // Validate business registration number
      if (!businessRegistrationNo || !businessRegistrationNo.trim()) {
        toast.error('Please enter business registration number');
        return;
      }

      // Validate company representative (first member)
      const representative = members[0];
      if (!representative.firstName || !representative.firstName.trim()) {
        toast.error('Please enter company representative first name');
        return;
      }
      if (!representative.lastName || !representative.lastName.trim()) {
        toast.error('Please enter company representative last name');
        return;
      }
      if (!representative.email || !representative.email.trim()) {
        toast.error('Please enter company representative email');
        return;
      }
      if (!representative.phone || !representative.phone.trim()) {
        toast.error('Please enter company representative contact number');
        return;
      }
    } else if (isKidsRegistration) {
      // Validate kids registration (child + parent/guardian info)
      const child = members[0];
      
      // Validate child info
      if (!child.firstName || !child.firstName.trim()) {
        toast.error("Please enter child's first name");
        return;
      }
      if (!child.lastName || !child.lastName.trim()) {
        toast.error("Please enter child's last name");
        return;
      }
      if (!child.dateOfBirth || !child.dateOfBirth.trim()) {
        toast.error("Please enter child's date of birth");
        return;
      }
      
      // Validate parent/guardian info
      if (!child.parentFirstName || !child.parentFirstName.trim()) {
        toast.error("Please enter parent/guardian's first name");
        return;
      }
      if (!child.parentLastName || !child.parentLastName.trim()) {
        toast.error("Please enter parent/guardian's last name");
        return;
      }
      if (!child.parentEmail || !child.parentEmail.trim()) {
        toast.error("Please enter parent/guardian's email");
        return;
      }
      if (!child.parentPhone || !child.parentPhone.trim()) {
        toast.error("Please enter parent/guardian's contact number");
        return;
      }
      if (!child.postalAddress || !child.postalAddress.trim()) {
        toast.error('Please enter postal address');
        return;
      }
    } else {
      // Validate members for individual/student
      for (const member of members) {
        if (!member.firstName || !member.firstName.trim()) {
          toast.error('Please enter first name for all members');
          return;
        }
        if (!member.lastName || !member.lastName.trim()) {
          toast.error('Please enter last name for all members');
          return;
        }
        
        // Validate student fields if student type
        if (selectedType.type === 'STUDENT') {
          if (!member.phone || !member.phone.trim()) {
            toast.error('Please enter mobile number for all members');
            return;
          }
          if (!member.institution || !member.institution.trim()) {
            toast.error('Please enter institution for all members');
            return;
          }
          if (!member.courseOfStudy || !member.courseOfStudy.trim()) {
            toast.error('Please enter course of study for all members');
            return;
          }
          if (!member.dateOfBirth || !member.dateOfBirth.trim()) {
            toast.error('Please enter date of birth for all members');
            return;
          }
          if (!member.studentEmail || !member.studentEmail.trim()) {
            toast.error('Please enter student email for all members');
            return;
          }
          if (!member.idCardUrl) {
            toast.error('Please upload ID card for all members');
            return;
          }
        } else {
          // For non-students (INDIVIDUAL), validate email and phone
          if (!member.email || !member.email.trim()) {
            toast.error('Please enter email for all members');
            return;
          }
          if (!member.phone || !member.phone.trim()) {
            toast.error('Please enter mobile number for all members');
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare data based on registration type
      let updatedMembers;
      let dataToSend: any;

      if (isTeamRegistration) {
        // For team registration: representative + team members
        const representative = {
          ...members[0],
          name: `${members[0].firstName || ''} ${members[0].lastName || ''}`.trim(),
          role: 'Lead',
        };

        dataToSend = {
          competitionId: competition.id,
          registrationTypeId: selectedType.id,
          country,
          participantType: selectedType.type,
          referralSource: referralSource || undefined,
          teamName,
          members: [representative],
          teamMembers: teamMembers.filter(m => m.trim() !== ''), // Only non-empty names
          agreements,
        };
      } else if (isCompanyRegistration) {
        // For company registration: representative + company info
        const representative = {
          ...members[0],
          name: `${members[0].firstName || ''} ${members[0].lastName || ''}`.trim(),
          role: 'Representative',
        };

        dataToSend = {
          competitionId: competition.id,
          registrationTypeId: selectedType.id,
          country,
          participantType: selectedType.type,
          referralSource: referralSource || undefined,
          companyName,
          businessRegistrationNo,
          members: [representative],
          agreements,
        };
      } else if (isKidsRegistration) {
        // For kids registration: child + parent/guardian info
        const child = {
          ...members[0],
          name: `${members[0].firstName || ''} ${members[0].lastName || ''}`.trim(),
          role: 'Child',
        };

        dataToSend = {
          competitionId: competition.id,
          registrationTypeId: selectedType.id,
          country,
          participantType: selectedType.type,
          referralSource: referralSource || undefined,
          members: [child],
          agreements,
        };
      } else {
        // For individual/student registration
        updatedMembers = members.map(member => ({
          ...member,
          name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name
        }));

        dataToSend = {
          competitionId: competition.id,
          registrationTypeId: selectedType.id,
          country,
          participantType: selectedType.type,
          referralSource: referralSource || undefined,
          members: updatedMembers,
          agreements,
        };
      }

      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Competition ID:', competition.id);
      console.log('Registration Type:', selectedType.name, 'ID:', selectedType.id);
      console.log('Is Team Registration:', isTeamRegistration);
      console.log('Is Company Registration:', isCompanyRegistration);
      console.log('Is Kids Registration:', isKidsRegistration);
      if (isTeamRegistration) {
        console.log('Team Name:', teamName);
        console.log('Team Members:', teamMembers);
      }
      if (isCompanyRegistration) {
        console.log('Company Name:', companyName);
        console.log('Business Registration No:', businessRegistrationNo);
      }
      if (isKidsRegistration) {
        console.log('Child Name:', `${members[0]?.firstName} ${members[0]?.lastName}`);
        console.log('Parent/Guardian:', `${members[0]?.parentFirstName} ${members[0]?.parentLastName}`);
      }
      console.log('Full payload:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch('/api/competitions/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      console.log('Response status:', response.status, response.statusText);
      
      const result = await response.json();
      
      console.log('Cart API response:', result);

      if (result.success) {
        console.log('✅ Successfully added to cart, cart item ID:', result.data?.cartItemId);
        
        // If editing, remove the old cart item
        if (editItemId) {
          console.log('🔄 Editing mode: Removing old cart item:', editItemId);
          try {
            const deleteResponse = await fetch(`/api/competitions/cart/remove?itemId=${editItemId}`, {
              method: 'DELETE',
            });
            
            if (deleteResponse.ok) {
              console.log('✅ Old cart item removed successfully');
              toast.success('Registration updated successfully!');
            } else {
              console.error('❌ Failed to remove old cart item');
              toast.warning('Updated cart but old item may still exist');
            }
          } catch (error) {
            console.error('Error removing old cart item:', error);
            toast.warning('Updated cart but old item may still exist');
          }
          
          // Clear edit mode
          if (onEditComplete) {
            onEditComplete();
          }
          setEditItemId(null);
        } else {
          toast.success('Added to cart successfully!');
        }
        
        // Call onCartUpdate to refresh the cart sidebar
        console.log('Calling onCartUpdate to refresh cart...');
        onCartUpdate();
        
        // Reset form to empty state
        setSelectedType(null);
        setTeamName('');
        setCompanyName('');
        setBusinessRegistrationNo('');
        setMembers([{ 
          name: '', 
          firstName: '',
          lastName: '',
          email: '' 
        }]);
        setTeamMembers(['']);
        setAgreements({
          agreedToTerms: false,
          agreedToWebsiteTerms: false,
          agreedToPrivacyPolicy: false,
          agreedToRefundPolicy: false,
        });
        setReferralSource('');
        setCountry('Sri Lanka');
      } else {
        console.error('❌ Failed to add to cart:', result.error);
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Edit Mode Banner */}
      {editItemId && (
        <div className="mb-6 p-3 bg-orange-50 border-l-2 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-black text-sm font-medium">Editing Registration</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onEditComplete) {
                  onEditComplete();
                }
                setEditItemId(null);
                // Reset form to empty state
                setSelectedType(null);
                setTeamName('');
                setCompanyName('');
                setBusinessRegistrationNo('');
                setMembers([{ name: '', firstName: '', lastName: '', email: '' }]);
                setTeamMembers(['']);
                setAgreements({
                  agreedToTerms: false,
                  agreedToWebsiteTerms: false,
                  agreedToPrivacyPolicy: false,
                  agreedToRefundPolicy: false,
                });
                setReferralSource('');
                setCountry('Sri Lanka');
                toast.info('Edit cancelled');
              }}
              className="px-3 py-1 text-xs text-black hover:text-white hover:bg-black border border-gray-300 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-bold text-black mb-6 pb-2 border-b border-gray-200">
        {editItemId ? 'Edit Registration' : 'Add New Registration'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Type Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-3">
            Registration Type <span className="text-orange-500">*</span>
          </label>
          <div className="space-y-2">
            {registrationTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center p-3 border rounded cursor-pointer transition-all ${
                  selectedType?.id === type.id
                    ? 'border-orange-500 bg-orange-50'
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
                  className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                />
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-black text-sm">{type.name}</h3>
                  {type.description && (
                    <p className="text-xs text-gray-600 mt-0.5">{type.description}</p>
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
              <label className="block text-sm font-semibold text-black mb-2">
                Country <span className="text-orange-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
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

            {/* Member Information - Different layout for Team vs Individual/Student */}
            {isTeamRegistration ? (
              /* Team Registration Form */
              <>
                {/* Team Name */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Team Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Team Representative Information */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Team Representative Information <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's First Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.firstName || ''}
                        onChange={(e) => {
                          const newFirstName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            firstName: newFirstName,
                            name: `${newFirstName} ${members[0]?.lastName || ''}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's Last Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.lastName || ''}
                        onChange={(e) => {
                          const newLastName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            lastName: newLastName,
                            name: `${members[0]?.firstName || ''} ${newLastName}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.email || ''}
                        onChange={(e) => handleMemberChange(0, 'email', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.phone || ''}
                        onChange={(e) => handleMemberChange(0, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Team Members (up to 10 members)
                  </label>
                  <div className="space-y-3">
                    {teamMembers.map((memberName, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => handleTeamMemberChange(index, e.target.value)}
                          placeholder={`Team Member ${index + 1} Name`}
                          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        {teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                      )}
                    </div>
                  ))}
                  </div>
                  {teamMembers.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddTeamMember}
                      className="mt-3 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Team Member
                    </button>
                  )}
                </div>
              </>
            ) : isCompanyRegistration ? (
              /* Company Registration Form */
              <>
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Company Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Company Representative Information */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Company Representative Information <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's First Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.firstName || ''}
                        onChange={(e) => {
                          const newFirstName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            firstName: newFirstName,
                            name: `${newFirstName} ${members[0]?.lastName || ''}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's Last Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.lastName || ''}
                        onChange={(e) => {
                          const newLastName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            lastName: newLastName,
                            name: `${members[0]?.firstName || ''} ${newLastName}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.email || ''}
                        onChange={(e) => handleMemberChange(0, 'email', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.phone || ''}
                        onChange={(e) => handleMemberChange(0, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Business Registration Number */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Business Registration No <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessRegistrationNo}
                    onChange={(e) => setBusinessRegistrationNo(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </>
            ) : isKidsRegistration ? (
              /* Kids Registration Form */
              <>
                {/* Child Information */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Child Information <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Child's First Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.firstName || ''}
                        onChange={(e) => {
                          const newFirstName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            firstName: newFirstName,
                            name: `${newFirstName} ${members[0]?.lastName || ''}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Child's Last Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.lastName || ''}
                        onChange={(e) => {
                          const newLastName = e.target.value;
                          const newMembers = [...members];
                          newMembers[0] = {
                            ...newMembers[0],
                            lastName: newLastName,
                            name: `${members[0]?.firstName || ''} ${newLastName}`.trim()
                          };
                          setMembers(newMembers);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Date of Birth <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={members[0]?.dateOfBirth || ''}
                        onChange={(e) => handleMemberChange(0, 'dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="mm/dd/yyyy"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-3">
                    Parent/Guardian Information <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's First Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.parentFirstName || ''}
                        onChange={(e) => handleMemberChange(0, 'parentFirstName', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Last Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.parentLastName || ''}
                        onChange={(e) => handleMemberChange(0, 'parentLastName', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.parentEmail || ''}
                        onChange={(e) => handleMemberChange(0, 'parentEmail', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.parentPhone || ''}
                        onChange={(e) => handleMemberChange(0, 'parentPhone', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Postal Address (Full address where the gift should be sent) <span className="text-orange-500">*</span>
                      </label>
                      <textarea
                        value={members[0]?.postalAddress || ''}
                        onChange={(e) => handleMemberChange(0, 'postalAddress', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Individual/Student Registration Form */
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-black">
                    {selectedType.type === 'INDIVIDUAL' ? 'Personal Information' : 'Student Information'} <span className="text-orange-500">*</span>
                  </label>
                  {members.length < selectedType.maxMembers && selectedType.type !== 'INDIVIDUAL' && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-sm text-orange-500 hover:text-yellow-700 font-medium"
                    >
                      + Add Member
                    </button>
                  )}
                </div>

                {members.map((member, index) => (
                  <div key={index} className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedType.type === 'STUDENT' ? (
                        <>
                          {/* Consent Message */}
                          <div className="md:col-span-2">
                            <div className="bg-yellow-50 border-l-4 border-orange-500 p-4 mb-4">
                              <div className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`consent-${index}`}
                                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                  required
                                />
                                <label htmlFor={`consent-${index}`} className="ml-3 text-sm text-black">
                                  <span className="font-semibold">Consent:</span> If you are selecting the Student category, designated for individuals below 25 years of age, please ensure the accuracy of the information provided. Any misrepresentation may result in disqualification or subject your application to further verification.
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              First Name <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.firstName || ''}
                              onChange={(e) => {
                                const newFirstName = e.target.value;
                                const newMembers = [...members];
                                newMembers[index] = {
                                  ...newMembers[index],
                                  firstName: newFirstName,
                                  name: `${newFirstName} ${member.lastName || ''}`.trim()
                                };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Last Name <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.lastName || ''}
                              onChange={(e) => {
                                const newLastName = e.target.value;
                                const newMembers = [...members];
                                newMembers[index] = {
                                  ...newMembers[index],
                                  lastName: newLastName,
                                  name: `${member.firstName || ''} ${newLastName}`.trim()
                                };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Mobile Number <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={member.phone || ''}
                              onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Name of the University or Institution <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.institution || ''}
                              onChange={(e) => handleMemberChange(index, 'institution', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Course of Study / Degree Program <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.courseOfStudy || ''}
                              onChange={(e) => handleMemberChange(index, 'courseOfStudy', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Date of Birth <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={member.dateOfBirth || ''}
                              onChange={(e) => handleMemberChange(index, 'dateOfBirth', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="mm/dd/yyyy"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Student Email (University/School Email) <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={member.studentEmail || ''}
                              onChange={(e) => handleMemberChange(index, 'studentEmail', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Student ID Card / National ID Card / Passport <span className="text-orange-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors cursor-pointer">
                              <input
                                type="file"
                                id={`id-card-${index}`}
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(index, file);
                                  }
                                }}
                                className="hidden"
                                required={!member.idCardUrl}
                                disabled={uploadingFiles[index]}
                              />
                              <label htmlFor={`id-card-${index}`} className="cursor-pointer">
                                {uploadingFiles[index] ? (
                                  <div className="flex flex-col items-center">
                                    <svg className="w-8 h-8 mx-auto mb-2 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-sm text-orange-500">Uploading...</span>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-sm text-gray-700">
                                      {member.idCardUrl ? 'Change file' : 'Click to upload file'}
                                    </span>
                                    {member.idCardFile && (
                                      <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {String(member.idCardFile)}
                                      </p>
                                    )}
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              First Name <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.firstName || ''}
                              onChange={(e) => {
                                const newFirstName = e.target.value;
                                const newMembers = [...members];
                                newMembers[index] = {
                                  ...newMembers[index],
                                  firstName: newFirstName,
                                  name: `${newFirstName} ${member.lastName || ''}`.trim()
                                };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Last Name <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.lastName || ''}
                              onChange={(e) => {
                                const newLastName = e.target.value;
                                const newMembers = [...members];
                                newMembers[index] = {
                                  ...newMembers[index],
                                  lastName: newLastName,
                                  name: `${member.firstName || ''} ${newLastName}`.trim()
                                };
                                setMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Email <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={member.email || ''}
                              onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Mobile Number <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={member.phone || ''}
                              onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              required
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Referral Source */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Where did you hear about us? <span className="text-orange-500">*</span>
              </label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
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
            <div className="space-y-2 bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-sm font-medium text-black mb-2">
                Please check the boxes below to proceed <span className="text-orange-500">*</span>
              </p>

              {[
                { key: 'agreedToTerms', label: 'I agree to the Competition Terms and Conditions' },
                { key: 'agreedToWebsiteTerms', label: "I agree to the Website's Terms and Conditions" },
                { key: 'agreedToPrivacyPolicy', label: "I agree to the Website's Privacy Policy" },
                { key: 'agreedToRefundPolicy', label: 'I agree to the Refund Policy' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={agreements[key as keyof AgreementData]}
                    onChange={(e) =>
                      setAgreements({ ...agreements, [key]: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    required
                  />
                  <span className="text-xs text-black">{label}</span>
                </label>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black hover:bg-orange-500 text-white font-medium py-2.5 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting 
                  ? (editItemId ? 'Updating...' : 'Adding...') 
                  : (editItemId ? '✓ Update Cart' : '+ Add to Cart')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

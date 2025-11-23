/**
 * Registration Form Component
 * Multi-step form for competition registration
 */

'use client';

import { useState, useEffect } from 'react';
import { Competition, CompetitionRegistrationType } from '@prisma/client';
import { MemberInfo, AgreementData } from '@/types/competition';
import { toast } from 'sonner';
import { trackAddToCart, trackViewItem, trackViewItemList, trackSelectItem, EcommerceItem } from '@/lib/google-analytics';

interface UserProfile {
  email: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface Props {
  competition: Competition;
  registrationTypes: CompetitionRegistrationType[];
  onCartUpdate: () => void;
  editingItem?: any; // Cart item being edited
  onEditComplete?: () => void; // Callback when edit is done
  userProfile?: UserProfile; // User profile data for auto-filling
}

export default function RegistrationForm({
  competition,
  registrationTypes,
  onCartUpdate,
  editingItem,
  onEditComplete,
  userProfile,
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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showErrors, setShowErrors] = useState(false);
  const [studentConsent, setStudentConsent] = useState(false);

  // Track view_item_list when landing on the registration page
  useEffect(() => {
    if (!editingItem && registrationTypes.length > 0) {
      const items: EcommerceItem[] = registrationTypes.map(type => ({
        item_id: `${competition.id}_${type.id}`,
        item_name: `${competition.title} - ${type.name}`,
        item_category: 'Competition Registration',
        item_category2: competition.title,
        item_category3: type.name,
        price: type.fee,
        quantity: 1,
        currency: 'LKR',
      }));
      trackViewItemList(items);
    }
  }, [competition, registrationTypes, editingItem]);

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
          studentEmail: m.studentEmail || '',
          dateOfBirth: m.dateOfBirth || '',
          courseOfStudy: m.courseOfStudy || '',
          idCardUrl: m.idCardUrl || '',
          parentFirstName: m.parentFirstName || '',
          parentLastName: m.parentLastName || '',
          parentEmail: m.parentEmail || '',
          parentPhone: m.parentPhone || '',
          postalAddress: m.postalAddress || '',
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

  // Auto-fill email, phone, first name, and last name from user profile when form loads (only for new registrations, not editing)
  useEffect(() => {
    // Only auto-fill if:
    // 1. User profile data is available
    // 2. Not currently editing an existing item
    // 3. Members array has at least one member
    // 4. Selected type is set (so we know what registration type we're dealing with)
    if (!userProfile || editingItem || members.length === 0 || !selectedType) {
      return;
    }

    const updatedMembers = [...members];
    const firstMember = updatedMembers[0];
    const isKidsType = selectedType.type === 'KIDS';
    const isStudentType = selectedType.type === 'STUDENT';
    let hasChanges = false;
    let nameFieldsUpdated = false;

    if (isKidsType) {
      // For Kids category: fill parent/guardian email, phone, and names (only if empty)
      if (!firstMember.parentEmail && userProfile.email) {
        updatedMembers[0].parentEmail = userProfile.email;
        hasChanges = true;
      }
      if (!firstMember.parentPhone && userProfile.phoneNumber) {
        updatedMembers[0].parentPhone = userProfile.phoneNumber;
        hasChanges = true;
      }
      // Fill parent names if available
      if (!firstMember.parentFirstName && userProfile.firstName) {
        updatedMembers[0].parentFirstName = userProfile.firstName;
        hasChanges = true;
      }
      if (!firstMember.parentLastName && userProfile.lastName) {
        updatedMembers[0].parentLastName = userProfile.lastName;
        hasChanges = true;
      }
    } else if (isStudentType) {
      // For Student category: fill student email, phone, and names (only if empty)
      if (!firstMember.studentEmail && userProfile.email) {
        updatedMembers[0].studentEmail = userProfile.email;
        hasChanges = true;
      }
      if (!firstMember.phone && userProfile.phoneNumber) {
        updatedMembers[0].phone = userProfile.phoneNumber;
        hasChanges = true;
      }
      // Fill first name and last name if available
      if (!firstMember.firstName && userProfile.firstName) {
        updatedMembers[0].firstName = userProfile.firstName;
        hasChanges = true;
        nameFieldsUpdated = true;
      }
      if (!firstMember.lastName && userProfile.lastName) {
        updatedMembers[0].lastName = userProfile.lastName;
        hasChanges = true;
        nameFieldsUpdated = true;
      }
      // Update name field after setting firstName/lastName
      if (nameFieldsUpdated) {
        updatedMembers[0].name = `${updatedMembers[0].firstName || ''} ${updatedMembers[0].lastName || ''}`.trim();
      }
    } else {
      // For Individual, Team, Company: fill email, phone, and names for representative/first member (only if empty)
      if (!firstMember.email && userProfile.email) {
        updatedMembers[0].email = userProfile.email;
        hasChanges = true;
      }
      if (!firstMember.phone && userProfile.phoneNumber) {
        updatedMembers[0].phone = userProfile.phoneNumber;
        hasChanges = true;
      }
      // Fill first name and last name if available
      if (!firstMember.firstName && userProfile.firstName) {
        updatedMembers[0].firstName = userProfile.firstName;
        hasChanges = true;
        nameFieldsUpdated = true;
      }
      if (!firstMember.lastName && userProfile.lastName) {
        updatedMembers[0].lastName = userProfile.lastName;
        hasChanges = true;
        nameFieldsUpdated = true;
      }
      // Update name field after setting firstName/lastName
      if (nameFieldsUpdated) {
        updatedMembers[0].name = `${updatedMembers[0].firstName || ''} ${updatedMembers[0].lastName || ''}`.trim();
      }
    }

    // Update members state only if we made changes
    if (hasChanges) {
      setMembers(updatedMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, selectedType?.id, editingItem?.id]);

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

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const validatePhone = (phone: string): boolean => {
    // Check if phone includes country code (starts with +)
    const phoneRegex = /^\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,4}$/;
    return phoneRegex.test(phone) || phone.length >= 10;
  };

  // Phone number auto-formatting
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Don't format if empty or just +
    if (cleaned.length <= 1) return cleaned;
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Extract country code (1-3 digits after +)
    const match = cleaned.match(/^\+(\d{1,3})(\d*)/);
    if (!match) return cleaned;
    
    const countryCode = match[1];
    const rest = match[2];
    
    // Format based on length
    // +XX XXX XXXX XXXX (common international format)
    if (rest.length === 0) {
      return `+${countryCode}`;
    } else if (rest.length <= 2) {
      return `+${countryCode} ${rest}`;
    } else if (rest.length <= 5) {
      return `+${countryCode} ${rest.slice(0, 2)} ${rest.slice(2)}`;
    } else if (rest.length <= 9) {
      return `+${countryCode} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    } else {
      return `+${countryCode} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    setShowErrors(true);
    const errors: {[key: string]: string} = {};

    if (!selectedType) {
      toast.error('Please select a registration type');
      errors['registrationType'] = 'Please select a registration type';
      setFieldErrors(errors);
      return;
    }

    // Validate referral source is required
    if (!referralSource || referralSource.trim() === '') {
      toast.error('Please select where you heard about us');
      errors['referralSource'] = 'Please select where you heard about us';
      setFieldErrors(errors);
      return;
    }

    // Different validation for team vs company vs individual/student
    if (isTeamRegistration) {
      // Validate team name
      if (!teamName || !teamName.trim()) {
        toast.error('Please enter team name');
        errors['teamName'] = 'Team name is required';
        setFieldErrors(errors);
        return;
      }

      // Validate team representative (first member)
      const representative = members[0];
      if (!representative.firstName || !representative.firstName.trim()) {
        toast.error('Please enter team representative first name');
        errors['rep_firstName'] = 'First name is required';
        setFieldErrors(errors);
        return;
      }
      if (!representative.lastName || !representative.lastName.trim()) {
        toast.error('Please enter team representative last name');
        errors['rep_lastName'] = 'Last name is required';
        setFieldErrors(errors);
        return;
      }
      if (!representative.email || !representative.email.trim()) {
        toast.error('Please enter team representative email');
        errors['rep_email'] = 'Email is required';
        setFieldErrors(errors);
        return;
      }
      if (!validateEmail(representative.email)) {
        toast.error('Please enter a valid email address');
        errors['rep_email'] = 'Invalid email format (example: user@email.com)';
        setFieldErrors(errors);
        return;
      }
      if (!representative.phone || !representative.phone.trim()) {
        toast.error('Please enter team representative contact number');
        errors['rep_phone'] = 'Phone number is required';
        setFieldErrors(errors);
        return;
      }
      // Strict validation: MUST start with + and country code
      const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
      if (!strictPhoneRegex.test(representative.phone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid phone number with country code');
        errors['rep_phone'] = 'Must include country code. Format: +94 71 234 5678';
        setFieldErrors(errors);
        return;
      }

      // Validate team members
      for (let i = 0; i < teamMembers.length; i++) {
        if (!teamMembers[i] || !teamMembers[i].trim()) {
          toast.error(`Please enter name for team member ${i + 1}`);
          errors[`teamMember_${i}`] = 'Member name is required';
          setFieldErrors(errors);
          return;
        }
        // Validate name length
        const memberName = teamMembers[i].trim();
        if (memberName.length < 2) {
          toast.error(`Team member ${i + 1} name must be at least 2 characters`);
          errors[`teamMember_${i}`] = 'Name must be at least 2 characters';
          setFieldErrors(errors);
          return;
        }
        if (memberName.length > 100) {
          toast.error(`Team member ${i + 1} name must be less than 100 characters`);
          errors[`teamMember_${i}`] = 'Name must be less than 100 characters';
          setFieldErrors(errors);
          return;
        }
      }
      
      // Check for duplicate team member names
      const memberNames = teamMembers.map(name => name.trim().toLowerCase());
      const duplicates = memberNames.filter((name, index) => memberNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        toast.error('Duplicate team member names are not allowed');
        errors['teamMembers'] = 'Each team member must have a unique name';
        setFieldErrors(errors);
        return;
      }
    } else if (isCompanyRegistration) {
      // Validate company name
      if (!companyName || !companyName.trim()) {
        toast.error('Please enter company name');
        errors['companyName'] = 'Company name is required';
        setFieldErrors(errors);
        return;
      }
      // Validate company name length
      if (companyName.trim().length < 2) {
        toast.error('Company name must be at least 2 characters');
        errors['companyName'] = 'Company name must be at least 2 characters';
        setFieldErrors(errors);
        return;
      }
      if (companyName.trim().length > 200) {
        toast.error('Company name must be less than 200 characters');
        errors['companyName'] = 'Company name must be less than 200 characters';
        setFieldErrors(errors);
        return;
      }

      // Validate business registration number
      if (!businessRegistrationNo || !businessRegistrationNo.trim()) {
        toast.error('Please enter business registration number');
        errors['businessRegistrationNo'] = 'Business registration number is required';
        setFieldErrors(errors);
        return;
      }
      // Validate business registration number length
      if (businessRegistrationNo.trim().length < 3) {
        toast.error('Business registration number must be at least 3 characters');
        errors['businessRegistrationNo'] = 'Business registration number must be at least 3 characters';
        setFieldErrors(errors);
        return;
      }
      if (businessRegistrationNo.trim().length > 50) {
        toast.error('Business registration number must be less than 50 characters');
        errors['businessRegistrationNo'] = 'Business registration number must be less than 50 characters';
        setFieldErrors(errors);
        return;
      }

      // Validate company representative (first member)
      const representative = members[0];
      if (!representative.firstName || !representative.firstName.trim()) {
        toast.error('Please enter company representative first name');
        errors['comp_rep_firstName'] = 'First name is required';
        setFieldErrors(errors);
        return;
      }
      if (!representative.lastName || !representative.lastName.trim()) {
        toast.error('Please enter company representative last name');
        errors['comp_rep_lastName'] = 'Last name is required';
        setFieldErrors(errors);
        return;
      }
      if (!representative.email || !representative.email.trim()) {
        toast.error('Please enter company representative email');
        errors['comp_rep_email'] = 'Email is required';
        setFieldErrors(errors);
        return;
      }
      if (!validateEmail(representative.email)) {
        toast.error('Please enter a valid email address');
        errors['comp_rep_email'] = 'Invalid email format (example: user@email.com)';
        setFieldErrors(errors);
        return;
      }
      if (!representative.phone || !representative.phone.trim()) {
        toast.error('Please enter company representative contact number');
        errors['comp_rep_phone'] = 'Contact number is required';
        setFieldErrors(errors);
        return;
      }
      // Strict validation: MUST start with + and country code
      const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
      if (!strictPhoneRegex.test(representative.phone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid phone number with country code');
        errors['comp_rep_phone'] = 'Must include country code. Format: +94 11 234 5678';
        setFieldErrors(errors);
        return;
      }
    } else if (isKidsRegistration) {
      // Validate kids registration (child + parent/guardian info)
      const child = members[0];
      
      // Validate child info
      if (!child.firstName || !child.firstName.trim()) {
        toast.error("Please enter child's first name");
        errors['child_firstName'] = 'First name is required';
        setFieldErrors(errors);
        return;
      }
      if (child.firstName.trim().length < 2) {
        toast.error("Child's first name must be at least 2 characters");
        errors['child_firstName'] = 'First name must be at least 2 characters';
        setFieldErrors(errors);
        return;
      }
      if (child.firstName.trim().length > 100) {
        toast.error("Child's first name must be less than 100 characters");
        errors['child_firstName'] = 'First name must be less than 100 characters';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.lastName || !child.lastName.trim()) {
        toast.error("Please enter child's last name");
        errors['child_lastName'] = 'Last name is required';
        setFieldErrors(errors);
        return;
      }
      if (child.lastName.trim().length < 2) {
        toast.error("Child's last name must be at least 2 characters");
        errors['child_lastName'] = 'Last name must be at least 2 characters';
        setFieldErrors(errors);
        return;
      }
      if (child.lastName.trim().length > 100) {
        toast.error("Child's last name must be less than 100 characters");
        errors['child_lastName'] = 'Last name must be less than 100 characters';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.dateOfBirth || !child.dateOfBirth.trim()) {
        toast.error("Please enter child's date of birth");
        errors['child_dateOfBirth'] = 'Date of birth is required';
        setFieldErrors(errors);
        return;
      }
      // Validate age (5-17 years)
      const birthDate = new Date(child.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (adjustedAge < 5) {
        toast.error('Child must be at least 5 years old');
        errors['child_dateOfBirth'] = 'Child must be at least 5 years old';
        setFieldErrors(errors);
        return;
      }
      if (adjustedAge > 17) {
        toast.error('Kids category is for children 5-17 years old');
        errors['child_dateOfBirth'] = 'Kids category is for children 5-17 years old';
        setFieldErrors(errors);
        return;
      }
      
      // Validate parent/guardian info
      if (!child.parentFirstName || !child.parentFirstName.trim()) {
        toast.error("Please enter parent/guardian's first name");
        errors['parent_firstName'] = 'Parent/Guardian first name is required';
        setFieldErrors(errors);
        return;
      }
      if (child.parentFirstName.trim().length < 2) {
        toast.error("Parent/Guardian first name must be at least 2 characters");
        errors['parent_firstName'] = 'First name must be at least 2 characters';
        setFieldErrors(errors);
        return;
      }
      if (child.parentFirstName.trim().length > 100) {
        toast.error("Parent/Guardian first name must be less than 100 characters");
        errors['parent_firstName'] = 'First name must be less than 100 characters';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.parentLastName || !child.parentLastName.trim()) {
        toast.error("Please enter parent/guardian's last name");
        errors['parent_lastName'] = 'Parent/Guardian last name is required';
        setFieldErrors(errors);
        return;
      }
      if (child.parentLastName.trim().length < 2) {
        toast.error("Parent/Guardian last name must be at least 2 characters");
        errors['parent_lastName'] = 'Last name must be at least 2 characters';
        setFieldErrors(errors);
        return;
      }
      if (child.parentLastName.trim().length > 100) {
        toast.error("Parent/Guardian last name must be less than 100 characters");
        errors['parent_lastName'] = 'Last name must be less than 100 characters';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.parentEmail || !child.parentEmail.trim()) {
        toast.error("Please enter parent/guardian's email");
        errors['parent_email'] = 'Parent/Guardian email is required';
        setFieldErrors(errors);
        return;
      }
      if (!validateEmail(child.parentEmail)) {
        toast.error('Please enter a valid email address');
        errors['parent_email'] = 'Invalid email format (example: parent@email.com)';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.parentPhone || !child.parentPhone.trim()) {
        toast.error("Please enter parent/guardian's contact number");
        errors['parent_phone'] = 'Parent/Guardian contact number is required';
        setFieldErrors(errors);
        return;
      }
      // Strict validation: MUST start with + and country code
      const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
      if (!strictPhoneRegex.test(child.parentPhone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid phone number with country code');
        errors['parent_phone'] = 'Phone number must include country code (e.g., +94771234567)';
        setFieldErrors(errors);
        return;
      }
      
      if (!child.postalAddress || !child.postalAddress.trim()) {
        toast.error('Please enter postal address');
        errors['postalAddress'] = 'Postal address is required';
        setFieldErrors(errors);
        return;
      }
      if (child.postalAddress.trim().length < 10) {
        toast.error('Postal address must be at least 10 characters');
        errors['postalAddress'] = 'Address must be at least 10 characters';
        setFieldErrors(errors);
        return;
      }
      if (child.postalAddress.trim().length > 500) {
        toast.error('Postal address must be less than 500 characters');
        errors['postalAddress'] = 'Address must be less than 500 characters';
        setFieldErrors(errors);
        return;
      }
    } else {
      // Validate members for individual/student
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const memberPrefix = members.length > 1 ? `member_${i}_` : '';
        
        if (!member.firstName || !member.firstName.trim()) {
          toast.error(`Please enter first name ${members.length > 1 ? `for member ${i + 1}` : ''}`);
          errors[`${memberPrefix}firstName`] = 'First name is required';
          setFieldErrors(errors);
          return;
        }
        if (!member.lastName || !member.lastName.trim()) {
          toast.error(`Please enter last name ${members.length > 1 ? `for member ${i + 1}` : ''}`);
          errors[`${memberPrefix}lastName`] = 'Last name is required';
          setFieldErrors(errors);
          return;
        }
        
        // Validate student fields if student type
        if (selectedType.type === 'STUDENT') {
          // Check student consent
          if (!studentConsent) {
            toast.error('Please accept the student category consent');
            errors['student_consent'] = 'You must accept the consent to register as a student';
            setFieldErrors(errors);
            return;
          }
          
          // Validate first name length
          if (member.firstName.trim().length < 2) {
            toast.error('First name must be at least 2 characters');
            errors['student_firstName'] = 'First name must be at least 2 characters';
            setFieldErrors(errors);
            return;
          }
          if (member.firstName.trim().length > 100) {
            toast.error('First name must be less than 100 characters');
            errors['student_firstName'] = 'First name must be less than 100 characters';
            setFieldErrors(errors);
            return;
          }
          
          // Validate last name length
          if (member.lastName.trim().length < 2) {
            toast.error('Last name must be at least 2 characters');
            errors['student_lastName'] = 'Last name must be at least 2 characters';
            setFieldErrors(errors);
            return;
          }
          if (member.lastName.trim().length > 100) {
            toast.error('Last name must be less than 100 characters');
            errors['student_lastName'] = 'Last name must be less than 100 characters';
            setFieldErrors(errors);
            return;
          }
          
          if (!member.phone || !member.phone.trim()) {
            toast.error(`Please enter mobile number ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_phone'] = 'Mobile number is required';
            setFieldErrors(errors);
            return;
          }
          // Strict validation: MUST start with + and country code
          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
          if (!strictPhoneRegex.test(member.phone.replace(/\s/g, ''))) {
            toast.error('Please enter a valid phone number with country code');
            errors['student_phone'] = 'Phone number must include country code (e.g., +94771234567)';
            setFieldErrors(errors);
            return;
          }
          
          if (!member.institution || !member.institution.trim()) {
            toast.error(`Please enter institution ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_institution'] = 'Institution is required';
            setFieldErrors(errors);
            return;
          }
          if (member.institution.trim().length < 5) {
            toast.error('Institution name must be at least 5 characters');
            errors['student_institution'] = 'Institution name must be at least 5 characters';
            setFieldErrors(errors);
            return;
          }
          if (member.institution.trim().length > 200) {
            toast.error('Institution name must be less than 200 characters');
            errors['student_institution'] = 'Institution name must be less than 200 characters';
            setFieldErrors(errors);
            return;
          }
          
          if (!member.courseOfStudy || !member.courseOfStudy.trim()) {
            toast.error(`Please enter course of study ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_course'] = 'Course of study is required';
            setFieldErrors(errors);
            return;
          }
          if (member.courseOfStudy.trim().length < 3) {
            toast.error('Course name must be at least 3 characters');
            errors['student_course'] = 'Course name must be at least 3 characters';
            setFieldErrors(errors);
            return;
          }
          if (member.courseOfStudy.trim().length > 150) {
            toast.error('Course name must be less than 150 characters');
            errors['student_course'] = 'Course name must be less than 150 characters';
            setFieldErrors(errors);
            return;
          }
          
          if (!member.dateOfBirth || !member.dateOfBirth.trim()) {
            toast.error(`Please enter date of birth ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_dob'] = 'Date of birth is required';
            setFieldErrors(errors);
            return;
          }
          // Validate age (16-25 years)
          const birthDate = new Date(member.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
          
          if (adjustedAge < 16) {
            toast.error('You must be at least 16 years old');
            errors['student_dob'] = 'You must be at least 16 years old';
            setFieldErrors(errors);
            return;
          }
          if (adjustedAge > 25) {
            toast.error('Student category is for individuals below 25 years');
            errors['student_dob'] = 'Student category is for individuals below 25 years';
            setFieldErrors(errors);
            return;
          }
          
          if (!member.studentEmail || !member.studentEmail.trim()) {
            toast.error(`Please enter student email ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_email'] = 'Student email is required';
            setFieldErrors(errors);
            return;
          }
          if (!validateEmail(member.studentEmail)) {
            toast.error('Please enter a valid student email address');
            errors['student_email'] = 'Invalid email format (example: user@email.com)';
            setFieldErrors(errors);
            return;
          }
          if (!member.idCardUrl) {
            toast.error(`Please upload ID card ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors['student_idCard'] = 'ID card upload is required';
            setFieldErrors(errors);
            return;
          }
        } else {
          // For non-students (INDIVIDUAL), validate email and phone
          if (!member.email || !member.email.trim()) {
            toast.error(`Please enter email ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors[`${memberPrefix}email`] = 'Email is required';
            setFieldErrors(errors);
            return;
          }
          if (!validateEmail(member.email)) {
            toast.error('Please enter a valid email address');
            errors[`${memberPrefix}email`] = 'Invalid email format (example: user@email.com)';
            setFieldErrors(errors);
            return;
          }
          if (!member.phone || !member.phone.trim()) {
            toast.error(`Please enter mobile number ${members.length > 1 ? `for member ${i + 1}` : ''}`);
            errors[`${memberPrefix}phone`] = 'Mobile number is required';
            setFieldErrors(errors);
            return;
          }
          if (!validatePhone(member.phone)) {
            toast.error('Please enter a valid phone number with country code');
            errors[`${memberPrefix}phone`] = 'Invalid format. Use: +94 71 234 5678';
            setFieldErrors(errors);
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
        
        // Track add_to_cart event
        if (selectedType) {
          const item: EcommerceItem = {
            item_id: `${competition.id}_${selectedType.id}`,
            item_name: `${competition.title} - ${selectedType.name}`,
            item_category: 'Competition Registration',
            item_category2: competition.title,
            item_category3: selectedType.name,
            price: selectedType.fee,
            quantity: 1,
            currency: 'LKR',
          };
          trackAddToCart([item]);
        }
        
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
        setStudentConsent(false);
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
                setStudentConsent(false);
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
          <div className="space-y-4">
            {/* For Digital & Physical Tree Categories */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                For Digital & Physical Tree Categories
              </h3>
              <div className="space-y-2 mt-2">
                {registrationTypes
                  .filter((type) => type.type !== 'KIDS')
                  .map((type) => (
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
                          // Track select_item when user selects a registration type
                          if (!editingItem) {
                            const item: EcommerceItem = {
                              item_id: `${competition.id}_${type.id}`,
                              item_name: `${competition.title} - ${type.name}`,
                              item_category: 'Competition Registration',
                              item_category2: competition.title,
                              item_category3: type.name,
                              price: type.fee,
                              quantity: 1,
                              currency: 'LKR',
                            };
                            trackSelectItem(item);
                            trackViewItem(item);
                          }
                          // Reset members if changing type
                          if (type.maxMembers < members.length) {
                            setMembers([members[0]]);
                          } else if (members.length === 0) {
                            // Ensure at least one member exists for auto-fill
                            setMembers([{ name: '', firstName: '', lastName: '', email: '' }]);
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

            {/* For Kids' Tree Category */}
            {registrationTypes.some((type) => type.type === 'KIDS') && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                  For Kids' Tree Category
                </h3>
                <div className="space-y-2 mt-2">
                  {registrationTypes
                    .filter((type) => type.type === 'KIDS')
                    .map((type) => (
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
                            // Track select_item when user selects a registration type
                            if (!editingItem) {
                              const item: EcommerceItem = {
                                item_id: `${competition.id}_${type.id}`,
                                item_name: `${competition.title} - ${type.name}`,
                                item_category: 'Competition Registration',
                                item_category2: competition.title,
                                item_category3: type.name,
                                price: type.fee,
                                quantity: 1,
                                currency: 'LKR',
                              };
                              trackSelectItem(item);
                              trackViewItem(item);
                            }
                            // Reset members if changing type
                            if (type.maxMembers < members.length) {
                              setMembers([members[0]]);
                            } else if (members.length === 0) {
                              // Ensure at least one member exists for auto-fill
                              setMembers([{ name: '', firstName: '', lastName: '', email: '' }]);
                            }
                          }}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <div className="ml-3 flex-1">
                          <h3 className="font-medium text-black text-sm">
                            {type.type === 'KIDS' ? 'Kids\' Entry' : type.name}
                          </h3>
                          {type.description && (
                            <p className="text-xs text-gray-600 mt-0.5">{type.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}
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
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      // Clear error when user types
                      if (fieldErrors['teamName'] && e.target.value.trim()) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors['teamName'];
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (!value || !value.trim()) {
                        setFieldErrors({ ...fieldErrors, teamName: 'Team name is required' });
                        setShowErrors(true);
                      }
                    }}
                    placeholder="Enter your team name"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      showErrors && fieldErrors['teamName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {showErrors && fieldErrors['teamName'] && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors['teamName']}
                    </p>
                  )}
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
                          // Clear error when user types
                          if (fieldErrors['rep_firstName'] && newFirstName.trim()) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['rep_firstName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (!value || !value.trim()) {
                            setFieldErrors({ ...fieldErrors, rep_firstName: 'First name is required' });
                            setShowErrors(true);
                          }
                        }}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['rep_firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['rep_firstName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['rep_firstName']}
                        </p>
                      )}
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
                          // Clear error when user types
                          if (fieldErrors['rep_lastName'] && newLastName.trim()) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['rep_lastName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (!value || !value.trim()) {
                            setFieldErrors({ ...fieldErrors, rep_lastName: 'Last name is required' });
                            setShowErrors(true);
                          }
                        }}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['rep_lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['rep_lastName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['rep_lastName']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.email || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'email', e.target.value);
                          // Clear error when user types and email is valid
                          if (fieldErrors['rep_email'] && validateEmail(e.target.value)) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['rep_email'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (!value || !value.trim()) {
                            setFieldErrors({ ...fieldErrors, rep_email: 'Email is required' });
                            setShowErrors(true);
                          } else if (!validateEmail(value)) {
                            setFieldErrors({ ...fieldErrors, rep_email: 'Invalid email format (example: user@email.com)' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="example@email.com"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['rep_email'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['rep_email'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['rep_email']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Valid email format required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Team Representative's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.phone || ''}
                        onChange={(e) => {
                          const formattedPhone = formatPhoneNumber(e.target.value);
                          handleMemberChange(0, 'phone', formattedPhone);
                          // Clear error when user types and phone is valid
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (fieldErrors['rep_phone'] && strictPhoneRegex.test(formattedPhone.replace(/\s/g, ''))) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['rep_phone'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (!value || !value.trim()) {
                            setFieldErrors({ ...fieldErrors, rep_phone: 'Phone number is required' });
                            setShowErrors(true);
                          } else if (!strictPhoneRegex.test(value.replace(/\s/g, ''))) {
                            setFieldErrors({ ...fieldErrors, rep_phone: 'Must include country code. Format: +94 71 234 5678' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="+94 71 234 5678"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['rep_phone'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['rep_phone'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['rep_phone']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Must include country code (e.g., +94 for Sri Lanka)</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Team Members ({teamMembers.filter(m => m.trim()).length}/10 members)
                  </label>
                  <div className="space-y-3">
                    {teamMembers.map((memberName, index) => (
                      <div key={index}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={memberName}
                            onChange={(e) => {
                              handleTeamMemberChange(index, e.target.value);
                              // Clear error when user types valid name
                              const value = e.target.value.trim();
                              if (fieldErrors[`teamMember_${index}`] && value.length >= 2 && value.length <= 100) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[`teamMember_${index}`];
                                setFieldErrors(newErrors);
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (!value) {
                                setFieldErrors({ ...fieldErrors, [`teamMember_${index}`]: 'Member name is required' });
                                setShowErrors(true);
                              } else if (value.length < 2) {
                                setFieldErrors({ ...fieldErrors, [`teamMember_${index}`]: 'Name must be at least 2 characters' });
                                setShowErrors(true);
                              } else if (value.length > 100) {
                                setFieldErrors({ ...fieldErrors, [`teamMember_${index}`]: 'Name must be less than 100 characters' });
                                setShowErrors(true);
                              }
                            }}
                            placeholder={`Team Member ${index + 1} Name`}
                            className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                              showErrors && fieldErrors[`teamMember_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
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
                        {showErrors && fieldErrors[`teamMember_${index}`] && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldErrors[`teamMember_${index}`]}
                          </p>
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
                  {showErrors && fieldErrors['teamMembers'] && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors['teamMembers']}
                    </p>
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
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      // Clear error when user types valid name
                      const value = e.target.value.trim();
                      if (fieldErrors['companyName'] && value.length >= 2 && value.length <= 200) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors['companyName'];
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (!value) {
                        setFieldErrors({ ...fieldErrors, companyName: 'Company name is required' });
                        setShowErrors(true);
                      } else if (value.length < 2) {
                        setFieldErrors({ ...fieldErrors, companyName: 'Company name must be at least 2 characters' });
                        setShowErrors(true);
                      } else if (value.length > 200) {
                        setFieldErrors({ ...fieldErrors, companyName: 'Company name must be less than 200 characters' });
                        setShowErrors(true);
                      }
                    }}
                    placeholder="Enter your company name"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      showErrors && fieldErrors['companyName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {showErrors && fieldErrors['companyName'] ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors['companyName']}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">{companyName.length}/200 characters</p>
                  )}
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
                          // Clear error when valid
                          const value = newFirstName.trim();
                          if (fieldErrors['comp_rep_firstName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['comp_rep_firstName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, comp_rep_firstName: 'First name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, comp_rep_firstName: 'First name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, comp_rep_firstName: 'First name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter first name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['comp_rep_firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['comp_rep_firstName'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['comp_rep_firstName']}
                        </p>
                      ) : null}
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
                          // Clear error when valid
                          const value = newLastName.trim();
                          if (fieldErrors['comp_rep_lastName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['comp_rep_lastName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, comp_rep_lastName: 'Last name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, comp_rep_lastName: 'Last name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, comp_rep_lastName: 'Last name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter last name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['comp_rep_lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['comp_rep_lastName'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['comp_rep_lastName']}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.email || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'email', e.target.value);
                          // Clear error when valid email
                          if (fieldErrors['comp_rep_email'] && validateEmail(e.target.value)) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['comp_rep_email'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, comp_rep_email: 'Email is required' });
                            setShowErrors(true);
                          } else if (!validateEmail(value)) {
                            setFieldErrors({ ...fieldErrors, comp_rep_email: 'Please enter a valid email address' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="example@company.com"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['comp_rep_email'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['comp_rep_email'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['comp_rep_email']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Valid email format required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Company Representative's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.phone || ''}
                        onChange={(e) => {
                          const formattedPhone = formatPhoneNumber(e.target.value);
                          handleMemberChange(0, 'phone', formattedPhone);
                          // Clear error when valid phone
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (fieldErrors['comp_rep_phone'] && strictPhoneRegex.test(formattedPhone.replace(/\s/g, ''))) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['comp_rep_phone'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, comp_rep_phone: 'Phone number is required' });
                            setShowErrors(true);
                          } else if (!strictPhoneRegex.test(value)) {
                            setFieldErrors({ ...fieldErrors, comp_rep_phone: 'Phone number must include country code (e.g., +94771234567)' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="+94 11 234 5678"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['comp_rep_phone'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['comp_rep_phone'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['comp_rep_phone']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +94 for Sri Lanka)</p>
                      )}
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
                    onChange={(e) => {
                      setBusinessRegistrationNo(e.target.value);
                      // Clear error when user types valid registration number
                      const value = e.target.value.trim();
                      if (fieldErrors['businessRegistrationNo'] && value.length >= 3 && value.length <= 50) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors['businessRegistrationNo'];
                        setFieldErrors(newErrors);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (!value) {
                        setFieldErrors({ ...fieldErrors, businessRegistrationNo: 'Business registration number is required' });
                        setShowErrors(true);
                      } else if (value.length < 3) {
                        setFieldErrors({ ...fieldErrors, businessRegistrationNo: 'Registration number must be at least 3 characters' });
                        setShowErrors(true);
                      } else if (value.length > 50) {
                        setFieldErrors({ ...fieldErrors, businessRegistrationNo: 'Registration number must be less than 50 characters' });
                        setShowErrors(true);
                      }
                    }}
                    placeholder="PV12345 or BR/2023/12345"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      showErrors && fieldErrors['businessRegistrationNo'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {showErrors && fieldErrors['businessRegistrationNo'] ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors['businessRegistrationNo']}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">{businessRegistrationNo.length}/50 characters • Enter your official business registration number</p>
                  )}
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
                          // Clear error when valid
                          const value = newFirstName.trim();
                          if (fieldErrors['child_firstName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['child_firstName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, child_firstName: 'First name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, child_firstName: 'First name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, child_firstName: 'First name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter child's first name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['child_firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['child_firstName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['child_firstName']}
                        </p>
                      )}
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
                          // Clear error when valid
                          const value = newLastName.trim();
                          if (fieldErrors['child_lastName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['child_lastName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, child_lastName: 'Last name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, child_lastName: 'Last name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, child_lastName: 'Last name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter child's last name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['child_lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['child_lastName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['child_lastName']}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Date of Birth <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={members[0]?.dateOfBirth || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'dateOfBirth', e.target.value);
                          // Clear error when valid
                          if (fieldErrors['child_dateOfBirth'] && e.target.value) {
                            // Validate age
                            const birthDate = new Date(e.target.value);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                            
                            if (adjustedAge >= 5 && adjustedAge <= 17) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors['child_dateOfBirth'];
                              setFieldErrors(newErrors);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, child_dateOfBirth: 'Date of birth is required' });
                            setShowErrors(true);
                          } else {
                            // Validate age (5-17 years)
                            const birthDate = new Date(value);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                            
                            if (adjustedAge < 5) {
                              setFieldErrors({ ...fieldErrors, child_dateOfBirth: 'Child must be at least 5 years old' });
                              setShowErrors(true);
                            } else if (adjustedAge > 17) {
                              setFieldErrors({ ...fieldErrors, child_dateOfBirth: 'Kids category is for children 5-17 years old' });
                              setShowErrors(true);
                            }
                          }
                        }}
                        max={new Date().toISOString().split('T')[0]}
                        placeholder="mm/dd/yyyy"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['child_dateOfBirth'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['child_dateOfBirth'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['child_dateOfBirth']}
                        </p>
                      ) : members[0]?.dateOfBirth ? (
                        (() => {
                          const birthDate = new Date(members[0].dateOfBirth);
                          const today = new Date();
                          const age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                          return (
                            <p className="text-xs text-gray-600 mt-1">Age: {adjustedAge} years</p>
                          );
                        })()
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Kids category is for children 5-17 years old</p>
                      )}
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
                        onChange={(e) => {
                          handleMemberChange(0, 'parentFirstName', e.target.value);
                          // Clear error when valid
                          const value = e.target.value.trim();
                          if (fieldErrors['parent_firstName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['parent_firstName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, parent_firstName: 'Parent/Guardian first name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, parent_firstName: 'First name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, parent_firstName: 'First name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter parent/guardian's first name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['parent_firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['parent_firstName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['parent_firstName']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Last Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={members[0]?.parentLastName || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'parentLastName', e.target.value);
                          // Clear error when valid
                          const value = e.target.value.trim();
                          if (fieldErrors['parent_lastName'] && value.length >= 2 && value.length <= 100) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['parent_lastName'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, parent_lastName: 'Parent/Guardian last name is required' });
                            setShowErrors(true);
                          } else if (value.length < 2) {
                            setFieldErrors({ ...fieldErrors, parent_lastName: 'Last name must be at least 2 characters' });
                            setShowErrors(true);
                          } else if (value.length > 100) {
                            setFieldErrors({ ...fieldErrors, parent_lastName: 'Last name must be less than 100 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter parent/guardian's last name"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['parent_lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['parent_lastName'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['parent_lastName']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Email <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={members[0]?.parentEmail || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'parentEmail', e.target.value);
                          // Clear error when valid
                          if (fieldErrors['parent_email'] && validateEmail(e.target.value)) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['parent_email'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, parent_email: 'Parent/Guardian email is required' });
                            setShowErrors(true);
                          } else if (!validateEmail(value)) {
                            setFieldErrors({ ...fieldErrors, parent_email: 'Invalid email format (example: parent@email.com)' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="parent@email.com"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['parent_email'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['parent_email'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['parent_email']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Valid email format required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Parent/Guardian's Contact Number <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={members[0]?.parentPhone || ''}
                        onChange={(e) => {
                          const rawPhone = e.target.value;
                          handleMemberChange(0, 'parentPhone', rawPhone);
                          // Clear error when valid
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (fieldErrors['parent_phone'] && strictPhoneRegex.test(rawPhone.replace(/\s/g, ''))) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['parent_phone'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, parent_phone: 'Parent/Guardian contact number is required' });
                            setShowErrors(true);
                          } else if (!strictPhoneRegex.test(value)) {
                            setFieldErrors({ ...fieldErrors, parent_phone: 'Phone number must include country code (e.g., +94771234567)' });
                            setShowErrors(true);
                          } else {
                            // Auto-format on blur
                            const formatted = formatPhoneNumber(value);
                            const newMembers = [...members];
                            newMembers[0] = {
                              ...newMembers[0],
                              parentPhone: formatted
                            };
                            setMembers(newMembers);
                          }
                        }}
                        placeholder="+94 71 234 5678"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['parent_phone'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {showErrors && fieldErrors['parent_phone'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['parent_phone']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +94 for Sri Lanka)</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Postal Address (Full address where the gift should be sent) <span className="text-orange-500">*</span>
                      </label>
                      <textarea
                        value={members[0]?.postalAddress || ''}
                        onChange={(e) => {
                          handleMemberChange(0, 'postalAddress', e.target.value);
                          // Clear error when valid
                          const value = e.target.value.trim();
                          if (fieldErrors['postalAddress'] && value.length >= 10 && value.length <= 500) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors['postalAddress'];
                            setFieldErrors(newErrors);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (!value) {
                            setFieldErrors({ ...fieldErrors, postalAddress: 'Postal address is required' });
                            setShowErrors(true);
                          } else if (value.length < 10) {
                            setFieldErrors({ ...fieldErrors, postalAddress: 'Address must be at least 10 characters' });
                            setShowErrors(true);
                          } else if (value.length > 500) {
                            setFieldErrors({ ...fieldErrors, postalAddress: 'Address must be less than 500 characters' });
                            setShowErrors(true);
                          }
                        }}
                        placeholder="Enter full postal address including street, city, and postal code"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          showErrors && fieldErrors['postalAddress'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        rows={3}
                        required
                      />
                      {showErrors && fieldErrors['postalAddress'] ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors['postalAddress']}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">{members[0]?.postalAddress?.length || 0}/500 characters • Full address for gift delivery</p>
                      )}
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
                            <div className={`border-l-4 p-4 mb-4 ${
                              showErrors && !studentConsent ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-orange-500'
                            }`}>
                              <div className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`consent-${index}`}
                                  checked={studentConsent}
                                  onChange={(e) => {
                                    setStudentConsent(e.target.checked);
                                    if (e.target.checked && fieldErrors['student_consent']) {
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors['student_consent'];
                                      setFieldErrors(newErrors);
                                    }
                                  }}
                                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                  required
                                />
                                <label htmlFor={`consent-${index}`} className="ml-3 text-sm text-black">
                                  <span className="font-semibold">Consent:</span> If you are selecting the Student category, designated for individuals below 25 years of age, please ensure the accuracy of the information provided. Any misrepresentation may result in disqualification or subject your application to further verification.
                                </label>
                              </div>
                              {showErrors && fieldErrors['student_consent'] && (
                                <p className="text-xs text-red-600 mt-2 ml-7 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {fieldErrors['student_consent']}
                                </p>
                              )}
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
                                // Clear error when valid
                                const value = newFirstName.trim();
                                if (fieldErrors['student_firstName'] && value.length >= 2 && value.length <= 100) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_firstName'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_firstName: 'First name is required' });
                                  setShowErrors(true);
                                } else if (value.length < 2) {
                                  setFieldErrors({ ...fieldErrors, student_firstName: 'First name must be at least 2 characters' });
                                  setShowErrors(true);
                                } else if (value.length > 100) {
                                  setFieldErrors({ ...fieldErrors, student_firstName: 'First name must be less than 100 characters' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="Enter your first name"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_firstName'] && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_firstName']}
                              </p>
                            )}
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
                                // Clear error when valid
                                const value = newLastName.trim();
                                if (fieldErrors['student_lastName'] && value.length >= 2 && value.length <= 100) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_lastName'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_lastName: 'Last name is required' });
                                  setShowErrors(true);
                                } else if (value.length < 2) {
                                  setFieldErrors({ ...fieldErrors, student_lastName: 'Last name must be at least 2 characters' });
                                  setShowErrors(true);
                                } else if (value.length > 100) {
                                  setFieldErrors({ ...fieldErrors, student_lastName: 'Last name must be less than 100 characters' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="Enter your last name"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_lastName'] && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_lastName']}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Mobile Number <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={member.phone || ''}
                              onChange={(e) => {
                                const formattedPhone = formatPhoneNumber(e.target.value);
                                handleMemberChange(index, 'phone', formattedPhone);
                                // Clear error when valid phone
                                const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                                if (fieldErrors['student_phone'] && strictPhoneRegex.test(formattedPhone.replace(/\s/g, ''))) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_phone'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                const strictPhoneRegex = /^\+\d{1,3}\d{9,14}$/;
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_phone: 'Phone number is required' });
                                  setShowErrors(true);
                                } else if (!strictPhoneRegex.test(value)) {
                                  setFieldErrors({ ...fieldErrors, student_phone: 'Phone number must include country code (e.g., +94771234567)' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="+94 70 123 4567"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_phone'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_phone'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_phone']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +94 for Sri Lanka)</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Name of the University or Institution <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.institution || ''}
                              onChange={(e) => {
                                handleMemberChange(index, 'institution', e.target.value);
                                // Clear error when valid
                                const value = e.target.value.trim();
                                if (fieldErrors['student_institution'] && value.length >= 5 && value.length <= 200) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_institution'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_institution: 'Institution name is required' });
                                  setShowErrors(true);
                                } else if (value.length < 5) {
                                  setFieldErrors({ ...fieldErrors, student_institution: 'Institution name must be at least 5 characters' });
                                  setShowErrors(true);
                                } else if (value.length > 200) {
                                  setFieldErrors({ ...fieldErrors, student_institution: 'Institution name must be less than 200 characters' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="University of Moratuwa"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_institution'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_institution'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_institution']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">{(member.institution || '').length}/200 characters</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Course of Study / Degree Program <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={member.courseOfStudy || ''}
                              onChange={(e) => {
                                handleMemberChange(index, 'courseOfStudy', e.target.value);
                                // Clear error when valid
                                const value = e.target.value.trim();
                                if (fieldErrors['student_course'] && value.length >= 3 && value.length <= 150) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_course'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_course: 'Course of study is required' });
                                  setShowErrors(true);
                                } else if (value.length < 3) {
                                  setFieldErrors({ ...fieldErrors, student_course: 'Course name must be at least 3 characters' });
                                  setShowErrors(true);
                                } else if (value.length > 150) {
                                  setFieldErrors({ ...fieldErrors, student_course: 'Course name must be less than 150 characters' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="B.Sc. in Computer Science"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_course'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_course'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_course']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">{(member.courseOfStudy || '').length}/150 characters</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Date of Birth <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={member.dateOfBirth || ''}
                              onChange={(e) => {
                                handleMemberChange(index, 'dateOfBirth', e.target.value);
                                // Clear error when valid
                                if (fieldErrors['student_dob'] && e.target.value) {
                                  const birthDate = new Date(e.target.value);
                                  const today = new Date();
                                  const age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                                  
                                  if (adjustedAge >= 16 && adjustedAge <= 25) {
                                    const newErrors = { ...fieldErrors };
                                    delete newErrors['student_dob'];
                                    setFieldErrors(newErrors);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_dob: 'Date of birth is required' });
                                  setShowErrors(true);
                                } else {
                                  const birthDate = new Date(value);
                                  const today = new Date();
                                  const age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                                  
                                  if (adjustedAge < 16) {
                                    setFieldErrors({ ...fieldErrors, student_dob: 'You must be at least 16 years old' });
                                    setShowErrors(true);
                                  } else if (adjustedAge > 25) {
                                    setFieldErrors({ ...fieldErrors, student_dob: 'Student category is for individuals below 25 years' });
                                    setShowErrors(true);
                                  }
                                }
                              }}
                              max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_dob'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_dob'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_dob']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Must be between 16-25 years old for student category</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Student Email (University/School Email) <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={member.studentEmail || ''}
                              onChange={(e) => {
                                handleMemberChange(index, 'studentEmail', e.target.value);
                                // Clear error when valid email
                                if (fieldErrors['student_email'] && validateEmail(e.target.value)) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors['student_email'];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (!value) {
                                  setFieldErrors({ ...fieldErrors, student_email: 'Student email is required' });
                                  setShowErrors(true);
                                } else if (!validateEmail(value)) {
                                  setFieldErrors({ ...fieldErrors, student_email: 'Please enter a valid email address' });
                                  setShowErrors(true);
                                } else {
                                  // Check if it's an educational email (optional warning, not blocking)
                                  const eduDomains = ['.edu', '.ac.', '.school'];
                                  const hasEduDomain = eduDomains.some(domain => value.toLowerCase().includes(domain));
                                  if (!hasEduDomain) {
                                    // Just show hint, don't block submission
                                    setFieldErrors({ ...fieldErrors, student_email_hint: 'Tip: Use your official university/school email (e.g., .edu, .ac.lk)' });
                                  } else if (fieldErrors['student_email_hint']) {
                                    const newErrors = { ...fieldErrors };
                                    delete newErrors['student_email_hint'];
                                    setFieldErrors(newErrors);
                                  }
                                }
                              }}
                              placeholder="student@university.ac.lk"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors['student_email'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors['student_email'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_email']}
                              </p>
                            ) : fieldErrors['student_email_hint'] ? (
                              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_email_hint']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Use your official university/school email address</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Student ID Card / National ID Card / Passport <span className="text-orange-500">*</span>
                            </label>
                            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                              showErrors && fieldErrors['student_idCard'] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-orange-500'
                            }`}>
                              <input
                                type="file"
                                id={`id-card-${index}`}
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Check file size (5MB limit)
                                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                                    if (file.size > maxSize) {
                                      setFieldErrors({ ...fieldErrors, student_idCard: 'File size must be less than 5MB' });
                                      setShowErrors(true);
                                      e.target.value = ''; // Clear the input
                                      return;
                                    }
                                    // Clear error and proceed with upload
                                    if (fieldErrors['student_idCard']) {
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors['student_idCard'];
                                      setFieldErrors(newErrors);
                                    }
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
                            {showErrors && fieldErrors['student_idCard'] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors['student_idCard']}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB • Accepted: Images (JPG, PNG) or PDF</p>
                            )}
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
                                // Clear error when user types
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}firstName`;
                                if (fieldErrors[fieldKey] && newFirstName.trim()) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors[fieldKey];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}firstName`;
                                if (!value || !value.trim()) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'First name is required' });
                                  setShowErrors(true);
                                }
                              }}
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}firstName`] 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}firstName`] && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}firstName`]}
                              </p>
                            )}
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
                                // Clear error when user types
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}lastName`;
                                if (fieldErrors[fieldKey] && newLastName.trim()) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors[fieldKey];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}lastName`;
                                if (!value || !value.trim()) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'Last name is required' });
                                  setShowErrors(true);
                                }
                              }}
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}lastName`] 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}lastName`] && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}lastName`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Email <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={member.email || ''}
                              onChange={(e) => {
                                handleMemberChange(index, 'email', e.target.value);
                                // Clear error when user types and email is valid
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}email`;
                                if (fieldErrors[fieldKey] && validateEmail(e.target.value)) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors[fieldKey];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}email`;
                                if (!value || !value.trim()) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'Email is required' });
                                  setShowErrors(true);
                                } else if (!validateEmail(value)) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'Invalid email format (example: user@email.com)' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="your.email@example.com"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}email`] 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}email`] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}email`]}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Valid email format required</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Mobile Number <span className="text-orange-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={member.phone || ''}
                              onChange={(e) => {
                                const formattedPhone = formatPhoneNumber(e.target.value);
                                handleMemberChange(index, 'phone', formattedPhone);
                                // Clear error when user types and phone is valid
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}phone`;
                                if (fieldErrors[fieldKey] && validatePhone(formattedPhone)) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors[fieldKey];
                                  setFieldErrors(newErrors);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const fieldKey = `${members.length > 1 ? `member_${index}_` : ''}phone`;
                                if (!value || !value.trim()) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'Mobile number is required' });
                                  setShowErrors(true);
                                } else if (!validatePhone(value)) {
                                  setFieldErrors({ ...fieldErrors, [fieldKey]: 'Invalid format. Use: +94 71 234 5678' });
                                  setShowErrors(true);
                                }
                              }}
                              placeholder="+94 70 123 4567"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}phone`] 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              required
                            />
                            {showErrors && fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}phone`] ? (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {fieldErrors[`${members.length > 1 ? `member_${index}_` : ''}phone`]}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">Must include country code (e.g., +94 for Sri Lanka)</p>
                            )}
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
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-black ${
                  showErrors && fieldErrors['referralSource'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
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
              {showErrors && fieldErrors['referralSource'] && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors['referralSource']}
                </p>
              )}
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

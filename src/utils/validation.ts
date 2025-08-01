// Phone number validation utilities
export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  type?: 'mobile' | 'landline' | 'voip' | 'unknown';
  country?: string;
  errors?: string[];
}

// US phone number regex patterns
const US_PHONE_PATTERNS = {
  // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, 123 456 7890, 1234567890
  basic: /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  // Area codes that are invalid in US
  invalidAreaCodes: ['000', '111', '555', '666', '777', '888', '999'],
  // Valid mobile area code prefixes (not exhaustive, but common ones)
  mobileAreaCodes: ['201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '276', '281', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '330', '331', '334', '336', '337', '339', '346', '347', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '458', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '530', '531', '534', '539', '540', '541', '551', '559', '561', '562', '563', '564', '567', '570', '571', '573', '574', '575', '580', '585', '586', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '657', '659', '660', '661', '662', '667', '669', '678', '681', '682', '689', '701', '702', '703', '704', '706', '707', '708', '712', '713', '714', '715', '716', '717', '718', '719', '720', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '828', '830', '831', '832', '838', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '945', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '984', '985', '986', '989']
};

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, errors: ['Phone number is required'] };
  }

  // Remove all non-numeric characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/\+(?!\d*$)/, '');
  
  // Check if it matches US phone pattern
  const match = phone.match(US_PHONE_PATTERNS.basic);
  if (!match) {
    return { 
      isValid: false, 
      errors: ['Invalid phone number format. Please use format: (123) 456-7890'] 
    };
  }

  const areaCode = match[2];
  const exchangeCode = match[3];
  const subscriberNumber = match[4];

  // Check for invalid area codes
  if (US_PHONE_PATTERNS.invalidAreaCodes.includes(areaCode)) {
    return { 
      isValid: false, 
      errors: [`Invalid area code: ${areaCode}`] 
    };
  }

  // Format the phone number
  const formatted = `(${areaCode}) ${exchangeCode}-${subscriberNumber}`;
  
  // Determine if it's likely a mobile number
  const isMobile = US_PHONE_PATTERNS.mobileAreaCodes.includes(areaCode);
  
  return {
    isValid: true,
    formatted,
    type: isMobile ? 'mobile' : 'unknown',
    country: 'US'
  };
}

// Address validation utilities
export interface AddressValidationResult {
  isValid: boolean;
  formatted?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  suggestions?: string[];
  errors?: string[];
}

// US state abbreviations
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia', 'PR': 'Puerto Rico', 'VI': 'Virgin Islands'
};

// ZIP code patterns by state
const ZIP_PATTERNS: { [key: string]: string[] } = {
  'AL': ['350', '351', '352', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369'],
  'AK': ['995', '996', '997', '998', '999'],
  'AZ': ['850', '851', '852', '853', '854', '855', '856', '857', '859', '860', '863', '864', '865'],
  'AR': ['716', '717', '718', '719', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729'],
  'CA': ['900', '901', '902', '903', '904', '905', '906', '907', '908', '910', '911', '912', '913', '914', '915', '916', '917', '918', '919', '920', '921', '922', '923', '924', '925', '926', '927', '928', '930', '931', '932', '933', '934', '935', '936', '937', '938', '939', '940', '941', '942', '943', '944', '945', '946', '947', '948', '949', '950', '951', '952', '953', '954', '955', '956', '957', '958', '959', '960', '961'],
  // Add more states as needed
};

export function validateAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): AddressValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!address.street || address.street.trim().length < 3) {
    errors.push('Street address is required (minimum 3 characters)');
  }
  
  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required (minimum 2 characters)');
  }
  
  if (!address.state) {
    errors.push('State is required');
  } else {
    // Validate state
    const stateUpper = address.state.toUpperCase();
    if (!US_STATES[stateUpper as keyof typeof US_STATES]) {
      // Try to find state by name
      const stateName = Object.entries(US_STATES).find(([_, name]) => 
        name.toLowerCase() === address.state?.toLowerCase()
      );
      if (!stateName) {
        errors.push('Invalid state. Please use 2-letter state code (e.g., CA, NY)');
      }
    }
  }
  
  if (!address.zip) {
    errors.push('ZIP code is required');
  } else {
    // Validate ZIP code format
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!zipPattern.test(address.zip)) {
      errors.push('Invalid ZIP code format. Use 5 digits (e.g., 12345) or ZIP+4 (e.g., 12345-6789)');
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Format the address
  const stateUpper = address.state!.toUpperCase();
  const stateCode = US_STATES[stateUpper as keyof typeof US_STATES] 
    ? stateUpper 
    : Object.entries(US_STATES).find(([_, name]) => 
        name.toLowerCase() === address.state!.toLowerCase()
      )?.[0] || stateUpper;
  
  return {
    isValid: true,
    formatted: {
      street1: address.street!.trim(),
      city: address.city!.trim(),
      state: stateCode,
      zip: address.zip!.trim(),
      country: 'US'
    }
  };
}

// Email validation
export function validateEmail(email: string): { isValid: boolean; errors?: string[] } {
  if (!email) {
    return { isValid: false, errors: ['Email is required'] };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { isValid: false, errors: ['Invalid email format'] };
  }
  
  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Check local part length
  if (localPart.length > 64) {
    return { isValid: false, errors: ['Email local part (before @) is too long'] };
  }
  
  // Check domain has at least one dot
  if (!domain.includes('.')) {
    return { isValid: false, errors: ['Email domain must have at least one dot'] };
  }
  
  // Check for common typos in popular domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domainLower = domain.toLowerCase();
  const suggestions: string[] = [];
  
  for (const correctDomain of commonDomains) {
    // Simple typo detection (1 character difference)
    if (isOneCharDifferent(domainLower, correctDomain)) {
      suggestions.push(`${localPart}@${correctDomain}`);
    }
  }
  
  return { 
    isValid: true,
    ...(suggestions.length > 0 && { errors: [`Did you mean: ${suggestions.join(', ')}?`] })
  };
}

// Helper function to check if two strings differ by one character
function isOneCharDifferent(str1: string, str2: string): boolean {
  if (Math.abs(str1.length - str2.length) > 1) return false;
  
  let differences = 0;
  let i = 0, j = 0;
  
  while (i < str1.length && j < str2.length) {
    if (str1[i] !== str2[j]) {
      differences++;
      if (differences > 1) return false;
      
      if (str1.length > str2.length) i++;
      else if (str2.length > str1.length) j++;
      else { i++; j++; }
    } else {
      i++;
      j++;
    }
  }
  
  return differences + (str1.length - i) + (str2.length - j) <= 1;
}
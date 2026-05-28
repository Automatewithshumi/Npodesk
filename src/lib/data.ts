export const COLOURS = [
  { bg: '#FAECE7', tx: '#712B13' },
  { bg: '#E6F1FB', tx: '#0C447C' },
  { bg: '#E1F5EE', tx: '#085041' },
  { bg: '#EEEDFE', tx: '#3C3489' },
  { bg: '#FAEEDA', tx: '#633806' },
  { bg: '#EAF3DE', tx: '#27500A' },
];

export const ini = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export const CAREGIVERS = [
  { name: 'Thandi Mokoena', id: 'CG-001', area: 'Soul City', assigned: 24, profiles: 24, pending: 0, phone: '071 111 2222', since: 'Jan 2026', c: 0, notes: 'Lead caregiver for Soweto North. Conducts home visits every Monday and Wednesday.' },
  { name: 'Bongani Zulu', id: 'CG-002', area: 'Senqobile Phase 1', assigned: 19, profiles: 17, pending: 2, phone: '082 222 3333', since: 'Feb 2026', c: 1, notes: 'Covers Alexandra zones 1–3. Also assists with meal distribution on Fridays.' },
  { name: 'Lindiwe Nxumalo', id: 'CG-003', area: 'Senqobile Phase 2', assigned: 21, profiles: 20, pending: 1, phone: '073 333 4444', since: 'Jan 2026', c: 2, notes: 'Experienced social worker background. Manages school-age beneficiary referrals.' },
  { name: 'Siphamandla Dube', id: 'CG-004', area: 'Tudor Shaft', assigned: 16, profiles: 14, pending: 2, phone: '079 444 5555', since: 'Mar 2026', c: 3, notes: 'New caregiver. In-progress training on the PFS profile system.' },
  { name: 'Nokwanda Mthembu', id: 'CG-005', area: 'Extension 10', assigned: 22, profiles: 22, pending: 0, phone: '081 555 6666', since: 'Jan 2026', c: 4, notes: 'Top performer. Collects profiles within 48hrs of beneficiary registration.' },
  { name: 'Ayanda Buthelezi', id: 'CG-006', area: 'Soul City', assigned: 15, profiles: 13, pending: 2, phone: '072 666 7777', since: 'Apr 2026', c: 5, notes: 'Assists Thandi in Soweto South. Focuses on elderly and disabled beneficiaries.' },
];

export const BENEFICIARIES = [
  { name: 'Nomsa Mahlangu', id: 'PFS-00142', type: 'Adult', area: 'Soul City', status: 'Active', hh: '5 members', phone: '071 234 5678', reg: '12 Jan 2026', cg: 'Thandi Mokoena', cgId: 'CG-001', c: 0, notes: 'Single mother, 3 children under 10. Weekly food parcel + hot meal Tuesdays.' },
  { name: 'Sipho Ndlovu', id: 'PFS-00198', type: 'Adult', area: 'Senqobile Phase 1', status: 'Active', hh: '3 members', phone: '082 567 8901', reg: '5 Feb 2026', cg: 'Bongani Zulu', cgId: 'CG-002', c: 1, notes: 'Unemployed, dependant on food support. Enrolled in skills program.' },
  { name: 'Gogo Dlamini', id: 'PFS-00067', type: 'Elderly', area: 'Soul City', status: 'Active', hh: '2 members', phone: '011 123 4567', reg: '3 Nov 2025', cg: 'Thandi Mokoena', cgId: 'CG-001', c: 2, notes: 'Elderly grandmother caring for 2 grandchildren. Receives elderly care meal daily.' },
  { name: 'Ayanda Khumalo', id: 'PFS-00231', type: 'Child', area: 'Senqobile Phase 2', status: 'New', hh: '6 members', phone: '073 890 1234', reg: '18 May 2026', cg: 'Lindiwe Nxumalo', cgId: 'CG-003', c: 3, notes: 'Enrolled via school feeding program referral. Profile pending caregiver visit.' },
  { name: 'Thabo Sithole', id: 'PFS-00089', type: 'Disabled', area: 'Tudor Shaft', status: 'Active', hh: '4 members', phone: '079 345 6789', reg: '22 Dec 2025', cg: 'Siphamandla Dube', cgId: 'CG-004', c: 4, notes: 'Wheelchair user. Home delivery required.' },
  { name: 'Lerato Mokoena', id: 'PFS-00175', type: 'Adult', area: 'Extension 10', status: 'Active', hh: '2 members', phone: '081 456 7890', reg: '14 Mar 2026', cg: 'Nokwanda Mthembu', cgId: 'CG-005', c: 5, notes: 'Pregnant, requires nutritionally-enriched meals.' },
  { name: 'Zanele Pietersen', id: 'PFS-00244', type: 'Child', area: 'Soul City', status: 'New', hh: '5 members', phone: '072 678 9012', reg: '20 May 2026', cg: 'Ayanda Buthelezi', cgId: 'CG-006', c: 0, notes: 'Referred by social worker. Profile collected 21 May 2026.' },
  { name: 'Moses Nkosi', id: 'PFS-00033', type: 'Elderly', area: 'Senqobile Phase 1', status: 'Inactive', hh: '1 member', phone: '083 234 5678', reg: '15 Aug 2025', cg: 'Bongani Zulu', cgId: 'CG-002', c: 1, notes: 'Recently moved to care facility. Status under review.' },
];

export const VOLUNTEERS = [
  { name: 'Nomsa Mokoena', role: 'Meal coordinator', area: 'Soul City', hrs: 48, shifts: 12, status: 'Active', phone: '071 111 0001', since: 'Jan 2026', c: 0, notes: 'Lead morning coordinator. Runs Soweto North hot meal station Mon, Wed, Sat.' },
  { name: 'Thabo Nkosi', role: 'Delivery driver', area: 'Senqobile Phase 1', hrs: 42, shifts: 10, status: 'Active', phone: '082 222 0002', since: 'Feb 2026', c: 1, notes: 'Has own vehicle. Covers Alexandra and surrounds. Available Mon, Fri, Sat.' },
  { name: 'Zanele Dlamini', role: 'School liaison', area: 'Senqobile Phase 2', hrs: 39, shifts: 9, status: 'Active', phone: '073 333 0003', since: 'Jan 2026', c: 2, notes: 'Works with 3 schools in Diepsloot. Coordinates school feeding referrals.' },
  { name: 'Kagiso Sithole', role: 'Food packer', area: 'Soul City', hrs: 31, shifts: 8, status: 'Active', phone: '079 444 0004', since: 'Mar 2026', c: 3, notes: 'Warehouse packer. Reliable, fast. Helps with stocktaking on last Friday of month.' },
  { name: 'Lerato Pietersen', role: 'Registration', area: 'Extension 10', hrs: 28, shifts: 7, status: 'Active', phone: '081 555 0005', since: 'Mar 2026', c: 4, notes: 'Handles new beneficiary intake forms. Bilingual — Zulu and English.' },
  { name: 'Sipho Radebe', role: 'Delivery driver', area: 'Tudor Shaft', hrs: 24, shifts: 6, status: 'New', phone: '072 666 0006', since: 'May 2026', c: 5, notes: 'New recruit. Completed orientation. First solo delivery run scheduled for Fri 23 May.' },
  { name: 'Busi Khumalo', role: 'Meal coordinator', area: 'Senqobile Phase 1', hrs: 0, shifts: 0, status: 'On leave', phone: '083 777 0007', since: 'Dec 2025', c: 0, notes: 'On medical leave until 1 June 2026. Shifts need cover until return.' },
  { name: 'Ayanda Buthelezi', role: 'Admin', area: 'Soul City', hrs: 20, shifts: 5, status: 'Active', phone: '084 888 0008', since: 'Apr 2026', c: 1, notes: 'Handles volunteer scheduling and WhatsApp group admin. Works remotely on Sundays.' },
];

export const DONORS = [
  { name: 'Shoprite Foundation', type: 'Corporate', total: 'R45,000', last: 'May 2026', method: 'Food goods', contact: 'csi@shoprite.co.za', since: 'Jan 2026', freq: 'Monthly', c: 0, corp: true, notes: 'Major corporate partner. Donates monthly food hampers. Requires quarterly impact report.' },
  { name: 'Pick n Pay CSI', type: 'Corporate', total: 'R36,000', last: 'May 2026', method: 'Food goods', contact: 'csi@pnp.co.za', since: 'Feb 2026', freq: 'Monthly', c: 1, corp: true, notes: 'Provides non-perishable goods. Prefers acknowledgement in social media posts.' },
  { name: 'NDA Grant', type: 'Government', total: 'R59,400', last: 'May 2026', method: 'EFT', contact: 'grants@nda.org.za', since: 'Jan 2026', freq: 'Monthly', c: 5, corp: true, notes: 'National Development Agency grant. Requires monthly narrative and financial reports.' },
  { name: 'Sandton Church', type: 'Community', total: 'R24,600', last: 'May 2026', method: 'In-kind', contact: 'admin@sandtonchurch.co.za', since: 'Mar 2026', freq: 'Monthly', c: 2, corp: false, notes: 'Donates volunteer time, cooked food and clothing. Very engaged partner community.' },
  { name: 'Sipho Radebe', type: 'Individual', total: 'R15,000', last: 'May 2026', method: 'EFT', contact: 'sipho@email.co.za', since: 'Jan 2026', freq: 'Monthly', c: 3, corp: false, notes: 'High-value individual donor. Gives R5,000/month via stop order. Prefers email updates.' },
  { name: 'Ayanda Khumalo', type: 'Individual', total: 'R7,500', last: 'May 2026', method: 'EFT', contact: 'ayanda@email.co.za', since: 'Feb 2026', freq: 'Monthly', c: 4, corp: false, notes: 'Regular individual donor. Interested in sponsoring school meals specifically.' },
  { name: 'Anglo American CSI', type: 'Corporate', total: 'R25,000', last: 'Mar 2026', method: 'EFT', contact: 'csi@angloamerican.com', since: 'Jan 2026', freq: 'Quarterly', c: 0, corp: true, notes: 'Quarterly corporate donor. Requires formal NPO receipt and audited financials annually.' },
];

export const SITES = [
  { name: 'Soweto North Kitchen', area: 'Soul City', program: 'Hot meals', today: 148, capacity: 200, hours: '07:00–12:00', days: 'Mon–Sat', volunteers: 6, address: '14 Vilakazi St, Soweto' },
  { name: 'Diepsloot Feeding Point', area: 'Senqobile Phase 2', program: 'Hot meals', today: 94, capacity: 120, hours: '07:30–12:00', days: 'Mon–Sat', volunteers: 4, address: 'Block 3, Diepsloot' },
  { name: 'Alexandra Hub', area: 'Senqobile Phase 1', program: 'Food parcels', today: 82, capacity: 100, hours: '09:00–13:00', days: 'Every Monday', volunteers: 5, address: '7th Ave, Alexandra' },
  { name: 'Tembisa Care Centre', area: 'Extension 10', program: 'Elderly care', today: 41, capacity: 60, hours: '10:00–13:00', days: 'Tue & Thu', volunteers: 3, address: 'Phomolong, Tembisa' },
  { name: 'Orange Farm School', area: 'Tudor Shaft', program: 'School feeding', today: 112, capacity: 150, hours: '06:30–09:00', days: 'Mon–Fri', volunteers: 4, address: 'Orange Farm Primary' },
  { name: 'Soweto South Outreach', area: 'Soul City', program: 'Weekend outreach', today: 68, capacity: 80, hours: '09:00–14:00', days: 'Sat & Sun', volunteers: 6, address: 'Kliptown, Soweto' },
  { name: 'Sandton Church Hall', area: 'Leswasham', program: 'Baby nutrition', today: 28, capacity: 40, hours: '09:00–11:00', days: 'Wednesdays', volunteers: 2, address: 'Sandton Church, Rivonia Rd' },
  { name: 'Diepsloot School No. 2', area: 'Senqobile Phase 2', program: 'School feeding', today: 0, capacity: 100, hours: '06:30–09:00', days: 'Mon–Fri', volunteers: 3, address: 'Diepsloot Combined School' },
];

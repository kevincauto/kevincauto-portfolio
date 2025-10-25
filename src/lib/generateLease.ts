import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';

export interface LeaseData {
  property: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  roomName: string;
  bathroom: string;
  maidService: boolean;
  privateParking: boolean;
}

const b = (text: string) => new TextRun({ text, bold: true });
const t = (text: string) => new TextRun(text);
const br = () => new Paragraph('');

const formatPhoneNumber = (phoneStr: string): string => {
  const cleaned = ('' + phoneStr).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return phoneStr;
};

export const generateLease = async (data: LeaseData) => {
  const landlordName = 'Kevin Cauto';
  const landlordEmail = 'KevinMCauto@gmail.com';
  const landlordPhone = '(267) 566-5301';
  const today = new Date().toLocaleDateString();

  // Fix for timezone issue by treating date strings as local
  const localStartDate = new Date(data.startDate.replace(/-/g, '/'));
  const localEndDate = new Date(data.endDate.replace(/-/g, '/'));

  const startDate = localStartDate.toLocaleDateString();
  const endDate = localEndDate.toLocaleDateString();
  
  const nextMonthDate = new Date(localStartDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  nextMonthDate.setDate(1);
  const nextMonthPaymentDate = nextMonthDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const firstMonthName = localStartDate.toLocaleString('en-US', { month: 'long' });


  const startDay = localStartDate.getDate();
  const endDayOfMonth = new Date(localStartDate.getFullYear(), localStartDate.getMonth() + 1, 0).getDate();
  const endDayOfLease = localEndDate.getDate();
  
  const isFullFirstMonth = startDay === 1 && endDayOfLease === endDayOfMonth;
  
  let firstMonthRentText = `${firstMonthName} rent`;
  let firstMonthRentAmount = data.monthlyRent;
  
  if (!isFullFirstMonth && localStartDate.getFullYear() === localEndDate.getFullYear() && localStartDate.getMonth() === localEndDate.getMonth()) {
      const leasedDays = endDayOfLease - startDay + 1;
      const proratedAmount = (leasedDays / endDayOfMonth) * data.monthlyRent;
      firstMonthRentAmount = Math.floor(proratedAmount);
      firstMonthRentText = `${firstMonthName} prorated rent`;
  }
  
  const totalPaidPriorToMoveIn = firstMonthRentAmount + data.securityDeposit;
  
  const storageArea = data.property.address === '900 E Hector St' ? 'basement' : 'garage';
  const outdoorArea = data.property.address === '900 E Hector St' ? 'porch' : 'deck';


  const doc = new Document({
    numbering: {
        config: [
            {
                reference: 'rent-numbering',
                levels: [
                    {
                        level: 0,
                        format: 'decimal',
                        text: '%1.',
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 360 },
                            },
                        },
                    },
                    {
                        level: 1,
                        format: 'bullet',
                        text: '•',
                        style: {
                            paragraph: {
                                indent: { left: 1440, hanging: 360 },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.PORTRAIT,
            width: 8.5 * 72 * 20, // Letter width in twips
            height: 11 * 72 * 20, // Letter height in twips
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun("TENANT's Initials: ____________")],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Lease Agreement',
              size: 36, // 18pt
              bold: true,
            }),
          ],
        }),
        br(),

        new Paragraph({ children: [b('DEFINITIONS: '), t('Wherever in this Lease the term “LANDLORD” is used, it shall be construed to also mean The Manager/Owner/Agent, as may be indicated by the specific context. Wherever in this Lease the term “TENANT” is used, it shall also include any family, visiting friends, dependents, guests, employees, or other invitees, as may be indicated by the specific context.')]}),
        br(),
        
        new Paragraph({ children: [b('NAMES: '), t(`This Lease is entered into between ${data.tenantName} (TENANT) and ${landlordName} (LANDLORD), on ${today} (today’s date). The TENANT is liable for the payment of rent and performance of all other terms of this Lease.`)]}),
        br(),

        new Paragraph({ children: [b('ADDRESS: '), t(`Subject to the terms and conditions in this Lease, LANDLORD rents to TENANT, and TENANT rents from LANDLORD, a room for residential purposes only, at the premises located at: ${data.property.address}, ${data.property.city}, ${data.property.state} ${data.property.zip} (Hereinafter referred to as the Premises).`)]}),
        br(),

        new Paragraph({ children: [b('CONTACT INFORMATION: '), t(`LANDLORD’s Current Phone Number: ${formatPhoneNumber(landlordPhone)}. TENANT’s Current Phone Number: ${formatPhoneNumber(data.tenantPhone)}. LANDLORD’s Current Email Address: ${landlordEmail}. TENANT’s Current Email Address: ${data.tenantEmail}. TENANT shall notify the LANDLORD of any change to their telephone number or email immediately, if there is a change.`)]}),
        br(),
        
        new Paragraph({ children: [b('BEDROOM: '), t(`The TENANT will occupy the ${data.roomName}. The TENANT is prohibited from entering any other bedroom. This bedroom is unfurnished and is single-occupancy.`)]}),
        br(),

        new Paragraph({ children: [b('BATHROOM: '), t(`The TENANT may use the ${data.bathroom} or the main floor half bathroom.`)]}),
        br(),

        new Paragraph({ children: [b('HOUSEMATE/HOUSEHOLD RULES: '), t('TENANT understands they will be sharing the Premises with several other housemates. TENANT will be respectful and amicable towards other housemates. The TENANT will not use, consume, or touch other housemates’ property, food, or possessions without permission. TENANT acknowledges that housemates will move-out over time and they will be replaced by new housemates selected by the LANDLORD.')]}),
        br(),

        new Paragraph({ children: [b('CLEAN SHARED AREAS: '), t(`The living room, kitchen, and ${outdoorArea} is to be shared by all housemates and kept in a clean condition.  Personal items should not be left on the main floor.  Shoes should be removed immediately upon entering the Premises.`)]}),
        br(),

        new Paragraph({ children: [b('KITCHEN RULES: '), t('TENANT will clean up after cooking and eating.  TENANT will not leave dirty dishes in the sink, but rather place them in the dishwasher or hand-wash them. Communal kitchen items like pots, pans, and spatulas need to be hand-washed right after use so others can use them.  Hand-washed items should be dried and put away immediately.')]}),
        br(),
        
        new Paragraph({ children: [b('COMMUNAL TASKS AND RESTOCKING RESOURCES: '), t('As a member of the household, TENANT will take out the trash and recycling, unload the dishwasher, and help stock communal items like paper towels, trash bags, and dish soap from time to time to keep the household running. If the TENANT shares a bathroom with other housemates, they will be required to purchase and share toilet paper and hand soap with all those using that bathroom. Batteries for the keypad door entrance(s) will need to be replaced and are the responsibility of the TENANT. If lightbulbs need to be replaced, this responsibility also falls on the TENANT.')]}),
        br(),

        new Paragraph({ children: [b('NOISE: '), t('Quiet hours for the Premises will be between 10 pm and 10 am.  TV, media, and music volume shall not disrupt other housemates.')]}),
        br(),

        new Paragraph({ children: [b('TERM: '), t(`TENANT shall lease the Premises beginning ${startDate} and continuing through ${endDate}. The Lease shall continue on a month-to-month basis after this initial period. Each month period shall begin on the first day of the month and end on the last day of the month. Written or email notice of 30 days before the 1st of TENANT's last month, or enough notice as needed by Pennsylvania law, from either the LANDLORD or TENANT, must be provided to terminate the lease. If proper notice is not given by the TENANT, they will be responsible for the entirety of the following month's rent. TENANT will always be responsible for their last month's full rent from the 1st to the last day of the month, even if they move-out before the last day of the month. The only exception is if a replacement tenant moves in after the TENANT's move-out date and before the last day of the month. In this case, the LANDLORD will not collect double rent for these overlapping dates and TENANT will be reimbursed or charged a prorated last month's rent based on the replacement tenant's days of occupancy.`)]}),
        br(),
        
        new Paragraph({ children: [b('RENT: '), t('The following terms apply to the rent payment for this Lease.')]}),
        new Paragraph({
          children: [b('RENT AMOUNT: '), t(`The rent for the Premises will be $${data.monthlyRent} per month. This amount includes utilities, internet, and cleaning service of the shared spaces${data.maidService ? ' and the TENANT\'s bedroom' : ''}.`)],
          numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('PARKING: '), t(`TENANT’s rent amount does ${data.privateParking ? '' : 'not '}include private parking.`)],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('MONEY PAID PRIOR TO MOVE-IN: '), t(`Total: $${totalPaidPriorToMoveIn}`)],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({ 
            text: `$${data.securityDeposit} for the deposit-to-hold/security deposit (due within 48 hours of lease signing)`,
            numbering: { reference: 'rent-numbering', level: 1 },
        }),
        new Paragraph({ 
            text: `$${firstMonthRentAmount} for ${firstMonthRentText} (due before ${startDate})`,
            numbering: { reference: 'rent-numbering', level: 1 },
        }),
        new Paragraph({
            children: [b('NEXT MONTH’S PAYMENT: '), t(`The next payment is due on ${nextMonthPaymentDate} in the amount of $${data.monthlyRent}.`)],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('DUE DATE/LATE FEE: '), t('Rent (including, without limitation, any other fees) shall be due on or before the 1st day of each month in advance, without notice or demand, and without deduction or offset. Monthly rent payments must be received no later than the end of the “grace period” which is the 5th day of the month. (Weekends or holidays occurring within those days shall not be added to the grace period.) If a monthly rent payment is received after the grace period, it shall be late and the TENANT shall be charged a late charge of $100 with an additional charge of $10 for each day the rent is not paid after the grace period until rent has been paid in full including late fee billing. Late fees and all other balances due with rent shall be considered rent as due. Payment must be received no later than 11:59pm on the last day of the grace period. This late charge is due with the monthly rent payment. Bad health, reduced hours at work, the loss of job, financial emergency or other circumstances will not excuse any late rent payments. The foregoing of late fees and charges shall not be construed as a waiver by LANDLORD of its right to declare a default under this Lease.')],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('EVICTION NOTICE: '), t('Should the TENANT fail to pay rent by the due date, LANDLORD may terminate the month-to-month lease at the end of the current month in accordance with Pennsylvania law. Any eviction proceedings will be conducted in compliance with the Pennsylvania Landlord and Tenant Act, including any required notice periods. LANDLORD may serve an eviction notice as required by applicable Pennsylvania law, and TENANT agrees to vacate the Premises within the legally prescribed time frame.')],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('PAYMENT METHOD:  '), t('All payments should be made using the Innago.com invoice system. Please note that there is a fee to use this service. This will be an approximate $2 fee to use the ACH payment system or approximately a 2.99% fee for credit card use.  Any other payment type needs to be approved by the LANDLORD in writing or email.')],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('PARTIAL PAYMENT: '), t('LANDLORD's acceptance of any partial rent payment shall not waive LANDLORD's right to require immediate payment of the unpaid balance of rent, or waive or affect LANDLORD's rights with respect to any remaining unpaid rent.')],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        new Paragraph({
            children: [b('RENT INCREASES: '), t('Any rent increases by the LANDLORD will require 30 or more days of notice to the TENANT.')],
            numbering: { reference: 'rent-numbering', level: 0 },
        }),
        br(),

        new Paragraph({ children: [b('DEPOSIT-TO-HOLD: '), t('The deposit-to-hold is used to reserve the future TENANT’s place in the rental.  If the TENANT were to not move into the rental, the LANDLORD would keep the deposit-to-hold. This is done to cover one month’s rent, so the LANDLORD can find a new renter. The deposit-to-hold automatically becomes the TENANT’s security deposit upon move-in.')]}),
        br(),
        
        new Paragraph({ children: [b('SECURITY DEPOSIT: '), t(`Contemporaneously with the execution of this Lease, TENANT shall deposit with LANDLORD a security deposit in the amount of $${data.securityDeposit}. The deposit will be returned to TENANT within the lesser of (i) sixty (60) days after the expiration of the term of this Lease or (ii) the maximum time period allowed by Pennsylvania law. Deductions from the security deposit will be itemized in writing and provided to the TENANT. Acceptable deductions include, but are not limited to: Unpaid rent, utilities, or other outstanding balances; Excessive damage beyond normal wear and tear (e.g., holes in walls, broken fixtures, stained carpets); Cleaning fees if the unit is left in an unsanitary condition; Costs associated with abandoned property removal. If the security deposit is held for more than two (2) years, it will be placed in an interest-bearing escrow account as required by Pennsylvania law.`)]}),
        br(),

        new Paragraph({ children: [b('FURNISHINGS AND APPLIANCES: '), t(`The following appliances are supplied with the Premises: Refrigerator, Stove, Dishwasher, Washer, Dryer, and Microwave,. TENANT agrees to keep the appliances they use in good condition. Supplied appliances may not be removed.  Furniture and decor in the main level will be supplied solely by the LANDLORD unless otherwise expressed by the LANDLORD.  No furniture may be added to the first floor without the LANDLORD’s approval. Televisions, electronics, or other devices may not be added to the shared common space. LANDLORD can remove furniture, televisions, and electronics from the first floor. Storage of large items in the ${storageArea} is at the LANDLORD’s discretion. The LANDLORD is not liable for any damage done to TENANT’s items while stored in the ${storageArea} by moisture, dust, pests, or otherwise.`)]}),
        br(),

        new Paragraph({ children: [b('GUESTS: '), t(`The TENANT’s room is single-occupancy and may only have one person, the TENANT, living there. No other person may live in the ${data.roomName}.  Overnight guests are allowed, but should not live at the Premises. Guests must abide by all applicable terms and conditions of this Lease, including any rules and regulations applicable to the Premises. Guest(s) should not sleep in the common area. If the TENANT has a guest or combination of guests staying more than eight (8) days within any thirty (30) day period, it is considered a violation of the lease agreement.`)]}),
        br(),

        new Paragraph({ children: [b('PREMISES USE: '), t('TENANT shall not use the Premises, nor any neighboring premises, for any illegal purpose, or for any other purpose than that of a residence. TENANT agrees to comply with and abide by all federal, state, county and municipal laws and ordinances in connection with TENANT’s occupancy and use of the Premises. No illegal drugs or controlled substances (unless specifically prescribed by a physician for a specific person residing or present on the Premises) are permitted on the Premises. No hazardous or dangerous activities are permitted on the Premises. TENANT  is to stay off the roof.  Absolutely no illegal drug use, public disturbances, physical abuse, verbal abuse, threats, pets, animals, firearms, or smoking is permitted on Premises. Any violations of the foregoing paragraph shall be an immediate and incurable default of this Lease and shall be cause for ending the lease or eviction.')]}),
        br(),
        
        new Paragraph({ children: [b('INTERNET USE: '), t('The LANDLORD provides shared internet access for tenant use. By using this service, Tenant agrees to: Use the internet legally and responsibly, without engaging in illegal downloads, hacking, or disruptive activities. Avoid excessive bandwidth use (e.g., torrenting, running servers) that may interfere with others. Indemnify the Landlord against any claims or legal issues arising from misuse. Understand that network activity is not private, and the Landlord may cooperate with authorities if unlawful use is suspected. Internet access may be restricted or terminated for misuse, without prior notice.')]}),
        br(),

        new Paragraph({ children: [b('SUBLETTING: '), t('TENANT may not sublease the Premises or any portion thereof nor assign this Lease.')]}),
        br(),

        new Paragraph({ children: [b('PEST CONTROL: '), t('TENANT shall inform LANDLORD at first sighting of any pests in order to avoid any infestation of pests. In signing this Lease, TENANT has first inspected the Premises and certifies that it has not observed any pests in their designated room.')]}),
        br(),

        new Paragraph({ children: [b('MOLD: '), t('TENANT acknowledges the necessity of housekeeping, ventilation, and moisture control (especially in the bathrooms) for mold prevention.  When moisture is present in the bathroom, TENANT will turn the bathroom fan on and keep the door open to prevent mold growth.  In signing this Lease, TENANT has first inspected the Premises and certifies that it has not observed mold, mildew or moisture within the Premises.  TENANT agrees to immediately notify LANDLORD if it observes mold/mildew and/or moisture conditions (from any source, including leaks), and allow LANDLORD to evaluate and make recommendations and/or take appropriate corrective action.  TENANT relieves LANDLORD from any liability for any bodily injury or damages to property caused by or associated with moisture or the growth of or occurrence of mold or mildew on the Premises.  In addition, execution of this Lease constitutes acknowledgement by TENANT that control of moisture and mold prevention are TENANT’s obligations under this Lease.')]}),
        br(),

        new Paragraph({ children: [b('DEFAULT: '), t('Should TENANT default under any of the terms and conditions of this Lease, LANDLORD shall have any and all remedies available under this Lease, at law, or in equity, including, without limitation: 1. The right to repossess the Premises through lawful eviction proceedings. 2. The right to recover unpaid rent, damages, and associated costs. 3. The right to recover reasonable expenses incurred by LANDLORD in re-renting, cleaning, and repairing the Premises. If evicted, TENANT shall remain responsible for rent payments until the unit is re-rented, in accordance with Pennsylvania law. LANDLORD will make reasonable efforts to mitigate damages by seeking a replacement tenant. TENANT acknowledges that they may not be charged rent for a period in which the Premises is occupied by a new tenant.')]}),
        br(),

        new Paragraph({ children: [b('ABANDONMENT: '), t('The Premises will be deemed abandoned if TENANT defaults in rent payment, appears absent from the Premises, and there is reason to believe that TENANT will not be returning to the Premises, as determined by LANDLORD in its reasonable discretion. Should the Premises be considered abandoned, LANDLORD will take possession immediately, and store TENANT’s personal property items, at TENANT’s expense.  LANDLORD shall have no liability to TENANT whatsoever in connection with the storage of any of TENANT’s personal property. TENANT shall indemnify, defend and hold LANDLORD harmless from and against any and all penalties, damages, fines, causes of action, liabilities, judgments, expenses (including, without limitation, attorneys’ fees) or charges incurred in connection with or arising from LANDLORD’s storage of TENANT’s personal property.')]}),
        br(),

        new Paragraph({ children: [b('DEATH/DISABILITY DURING LEASE: '), t('A representative of the deceased TENANT may terminate this Lease by providing verified written documentation testifying to such TENANT’s death.')]}),
        br(),
        
        new Paragraph({ children: [b('UTILITIES: '), t(`The electric, gas, water, cleaning service, and internet bill will be covered by the tenant’s rent. ${data.maidService ? 'Maid cleaning will occur about once a month in the shared areas of the Premises.' : ''}`)]}),
        br(),
        
        new Paragraph({ children: [b('PLUMBING: '), t('TENANT agrees not to place into any drain lines non-approved substances such as cooking grease, sanitary napkins, or other similar objects that may cause a stoppage. TENANT shall notify the LANDLORD of any plumbing leak, flooding, or water damage right away. . If a toilet is clogged, the TENANT is responsible to plunge the toilet. If there is occasional slow drainage in the shower or sink, TENANT should take reasonable measures (clearing visible debris, pouring kettle-hot water, using a plunger, or using a product like Drano) to resolve this before contacting the LANDLORD. Once contacted, LANDLORD shall use all reasonable efforts to remedy the plumbing problem.')]}),
        br(),
        
        new Paragraph({ children: [b('LIABILITY AND RENTERS INSURANCE: '), t('TENANT understands and agrees that LANDLORD has no obligation to obtain insurance for TENANT including, but not limited to, liability, hazard, or contents insurance.  TENANT shall, at TENANT’s sole cost and expense, obtain renter’s insurance covering the full value of all personal property of TENANT in the Premises, and providing liability coverage to TENANT, which policy shall name LANDLORD as an additional insured.  TENANT shall maintain such renter’s insurance at all times during the term of this Lease.  TENANT acknowledges that if TENANT fails to obtain and maintain renter’s insurance, TENANT alone shall bear the consequences of the loss or damage to TENANT’s personal property.')]}),
        br(),
        
        new Paragraph({ children: [b('ACCESS/PRIVACY: '), t('The LANDLORD may enter common areas of the Premises at any time. The LANDLORD may enter the TENANT\'s room only for the following reasons: (a) in case of emergency; (b) to make necessary or agreed-upon repairs or improvements, supply necessary or agreed-upon services, or exhibit the dwelling unit to prospective or actual purchasers, appraisers, mortgagees, prospective tenants, workers, or contractors; (c) when the TENANT has abandoned or surrendered the premises; or (d) pursuant to court order. The landlord must give the tenant 24 hours notice of intent to enter and may enter only during reasonable hours, except by necessity, cases (a) and (c) above. TENANT’s request for service or maintenance shall be considered TENANT’s approval for all necessary access by LANDLORD or LANDLORD’s agent in connection with such service or maintenance, if no other written arrangement related to such access between LANDLORD and TENANT is made.')]}),
        br(),
        
        new Paragraph({ children: [b('MAINTENANCE: '), t('LANDLORD agrees to maintain the structure, roof and foundation of the Premises, and the heating, plumbing and electrical systems of the Premises unless the repairs needed are a result of any act or omission of TENANT (excluding normal wear and tear).  In such case that the damage is a result of the act or omission of TENANT, TENANT will be billed for the repair. LANDLORD will carry out all required repairs in as reasonable a time as possible in accordance to applicable laws,  but will not be liable to TENANT for any disruptions or inconvenience to TENANT or any claim that the Premises is uninhabitable (except to the extent of any non-waivable warranty of habitability provided by applicable laws).')]}),
        br(),
        
        new Paragraph({ children: [b('CARE OF THE PREMISES - '), t('TENANT agrees to care for the Premises and keep it in a good, neat and sanitary condition. Trash shall be placed in approved receptacles only and may not be left outside for any amount of time. TENANT shall report all building damage, water leaks, or other maintenance issues immediately to LANDLORD or will be held liable for the costs of repairing any unreported damage. If the need to repair is caused by TENANT or TENANT’s family, visiting friends, dependents, guests, licensees or invitees, LANDLORD may make the necessary repairs and the cost of which will be treated as additional rent to be paid by the TENANT upon notification of amount. Failure to pay costs of repairs will be treated as additional rent payable by TENANT and due immediately. TENANT agrees not to affix any structures to the Premises including, but not limited to, antennas, satellite dishes, or signs, without prior written consent of LANDLORD, which may be granted or withheld in LANDLORD’s sole and absolute discretion. After contacting emergency services, TENANT agrees to give immediate notice to LANDLORD of any fire, flood, or other damage to or within the Premises. If the Premises is damaged and the Premises rendered uninhabitable, the rent shall cease until such a time as the Premises has been repaired or LANDLORD shall have the option of terminating this Lease upon five (5) days’ prior written notice. TENANT agrees not to store boats, motorcycles, RVs, waterbeds, firearms, equipment, hazardous materials, paints, fuel, chemicals, waste, and non-usable items, including non-operating vehicles, in or around the Premises without prior written consent of LANDLORD, which may be granted or withheld in LANDLORD’s sole and absolute discretion.')]}),
        br(),
        
        new Paragraph({ children: [b('ANIMALS: '), t('Pets or any animals are not allowed to reside or enter the Premises.')]}),
        br(),

        new Paragraph({ children: [b('SMOKING: '), t('TENANT shall not smoke on the Premises, including the use of any vapor products.  The TENANT shall not smell like smoke or tobacco on the Premises.')]}),
        br(),

        new Paragraph({ children: [b('MARIJUANA AND OTHER DRUGS: '), t('TENANT shall not be permitted to, and shall not permit any family, visiting friends, dependents, guests, licensees or invitees of TENANT to grow, produce, possess, consume, use, or smoke any marijuana, cannabis or any products containing marijuana or cannabis in any location in, on or about the Premises; the foregoing prohibition to be absolute and without exception and shall include any growing, production, possession, use or consumption pursuant to any medical use or medical prescription, or any medical, retail or recreational marijuana activities that may otherwise be permitted under any local, state or federal laws, rules or regulations now or hereafter in effect.  TENANT’s violation of this rule shall be an immediate default of this Lease.')]}),
        br(),
        
        new Paragraph({ children: [b('QUIET ENJOYMENT: '), t('TENANT is entitled to quiet enjoyment of the Premises during the duration of the term of this Lease, subject to all the terms and conditions of this Lease. TENANT may not infringe upon the quiet enjoyment right of other tenants through disturbances including but not limited to TVs, computers, stereos, musical instruments, other loud noises, heavy walking, or other disturbing actions.')]}),
        br(),
        
        new Paragraph({ children: [b('LAWN: '), t('TENANT is not responsible for lawn maintenance.')]}),
        br(),
        
        new Paragraph({ children: [b('ALTERATIONS: '), t('TENANT agrees not to make any repairs, improvements, or alterations to the Premises unless prior written permission is given by LANDLORD, which may be given or withheld in LANDLORD’s sole and absolute discretion.  Any repairs, improvements, or alterations made by TENANT must be completed in compliance with all local, state, and federal laws.  As used herein “repairs, improvements, or alterations” includes, without limitation, lock changes, painting, replacing fixtures, installing wallpaper, attaching shelves, installing curtains or shades, or other permanent or semi-permanent changes to the Premises.')]}),
        br(),
        
        new Paragraph({ children: [b('KEYS AND LOCKOUTS: '), t('LANDLORD shall provide a unique number combination for the Premise’s front-door keypad lock to the TENANT and a physical key to lock their designated room.  If TENANT changes the lock, and LANDLORD is prevented from entering the Premises or room due to the lock change, TENANT shall bear the financial cost of LANDLORD’s effort to enter by force. If LANDLORD or contractor is unable to enter the Premises or designated room to perform repair or maintenance tasks due to the TENANT’s unauthorized lock change, TENANT will be charged $100.00 for each violation, which will be charged to TENANT as additional rent and due immediately.  Upon vacating the Premises, TENANT shall return all keys to LANDLORD or TENANT will be charged $50.00 per unreturned key.  If TENANT is locked out of the Premises or their designated room, and LANDLORD must unlock the door for TENANT, then TENANT will be charged a $100.00 lock-out fee.')]}),
        br(),
        
        new Paragraph({ children: [b('SMOKE AND CARBON MONOXIDE DETECTORS: '), t('The Premises has been equipped with smoke detectors. TENANT agrees these detectors are in working order and agrees to periodically test and maintain the smoke detector in their designated bedroom and shared spaces.')]}),
        br(),
        
        new Paragraph({ children: [b('MOVE-IN: '), t('As of the commencement of the Lease, TENANT acknowledges that TENANT has examined the Premises and approves of the condition of the Premises, including all systems and appliances in the Premises. Taking possession of the Premises by TENANT is conclusive that the Premises are in good order and satisfactory condition.')]}),
        br(),
        
        new Paragraph({ children: [b('MOVE OUT INSTRUCTIONS: '), t('If the TENANT intends to move out, the TENANT is asked to give the LANDLORD at least 30 days notice, or the required number of days under Pennsylvania law, written or email notice before the 1st of the month. TENANT will be responsible for paying the next month’s rent in its entirety if the required number of days notice is not given. TENANT must supply a forwarding address to LANDLORD. TENANT agrees that TENANT will leave the Premises, their room, and designated bathroom in the same or better condition than when TENANT moved in (ordinary wear and tear excepted), or may be charged for any repairs or cleaning needed to prepare the Premises for the next tenant.  Upon receipt of TENANT’s notice to vacate the Premises, LANDLORD will schedule a move-out inspection of the Premises. TENANT has the right, but not the obligation, to be present for this inspection, which will take place after all of TENANT’s belongings have been removed from the Premises.  The TENANT will allow tours of the room, for new potential tenants, to take place if 24-hour notice is given by the LANDLORD.')]}),
        br(),

        new Paragraph({ children: [b('NOTICES: '), t('Any notices required by either law or this Lease may be mailed, emailed, hand delivered to TENANT, or left posted on the door as long as it is applicable by law. Notices will be posted after the grace period for rental payment.')]}),
        br(),

        new Paragraph({ children: [b('INDEMNIFICATION & LIABILITY: '), t('LANDLORD shall not be held liable for any acts by, or injury or damage to, any persons on or about the Premises, except in cases of LANDLORD’s gross negligence or willful misconduct. TENANT shall indemnify, defend, and hold LANDLORD harmless from claims or damages arising from TENANT’s use or occupancy of the Premises, except in cases where such claims result from LANDLORD’s failure to maintain a safe and habitable environment as required by Pennsylvania law.')]}),
        br(),

        new Paragraph({ children: [b('INVALID CLAUSES: '), t('Any provision of this Lease that is found unenforceable or invalid shall not affect any other term or provision contained herein and all other provisions of this Lease shall be enforceable and valid as permitted by applicable laws. If such invalid or unenforceable provisions exist, at LANDLORD’s sole discretion, those provisions shall be (a) modified to the extent necessary to comply with such law, or (b) removed from this Lease and will cease to be a part thereof.')]}),
        br(),

        new Paragraph({ children: [b('SUBORDINATION: '), t('The Lease is subordinate to all existing and future mortgages, deeds of trust and other security interests on the Premises.')]}),
        br(),

        new Paragraph({ children: [b('WAIVER: '), t('The failure of the LANDLORD to insist, in any one or more instances, upon strict performance of any of the covenants of this Lease, or to exercise any option herein contained, shall not be construed as a waiver or a relinquishment for the future of such covenant or option, but the same shall continue and remain in full force and effect.')]}),
        br(),
        
        new Paragraph({ children: [b('ENTIRE LEASE: '), t('This Lease agreement and any attached addendums constitute the entire agreement between parties and can only be changed by a written instrument signed by both LANDLORD and TENANT. No agreement made verbally outside this Lease shall be considered valid or legally binding.')]}),
        br(),
        
        new Paragraph({ children: [b('HEADINGS: '), t('Section headings or titles in this Lease are for convenience only and shall not be deemed to be part of the Lease.')]}),
        br(),
        
        new Paragraph({ children: [b('PRONOUNS: '), t('Whenever the terms referred to in the Lease are singular, the same shall be deemed to mean the plural, as the context indicates, and vice versa.')]}),
        br(),
        
        new Paragraph({ children: [b('WAIVER OF JURY TRIAL: '), t('To the maximum extent permitted by law, landlord and tenant each waive any right to trial by jury in any litigation or to have a jury participate in resolving any dispute arising out of or with respect to this lease or any other instrument, document or agreement executed or delivered in connection herewith or the transactions related hereto.')]}),
        br(),
        
        new Paragraph({ children: [b('NOTICE OF LANDLORD DEFAULT: '), t('In the event of any alleged default in the obligation of LANDLORD under this Lease, TENANT will deliver to LANDLORD written notice specifying the nature of LANDLORD\'s default and LANDLORD will have thirty (30) days following receipt of such notice to cure such alleged default or, in the event the alleged default cannot reasonably be cured within a 30-day period, to commence action and proceed diligently to cure such alleged default.')]}),
        br(),
        
        new Paragraph({ children: [b('COVENANTS, CONDITIONS AND RESTRICTIONS: '), t('This Lease shall be subject to and TENANT shall comply with all recorded covenants, conditions and restrictions affecting the Premises.  TENANT’s failure to comply with such covenants, conditions and restrictions shall be a default of this Lease.')]}),
        br(),

        new Paragraph({ children: [b('IN WITNESS WHEREOF, '), t('TENANT hereby acknowledges they have read this Lease, understand both the TENANT’s and LANDLORD’s rights and responsibilities, and agrees to abide by the terms set forth in this Lease and any attached addendums.')]}),
        br(),br(),

        new Paragraph('TENANT__________________________________________________Date: ___________________'),
        br(),br(),
        new Paragraph('LANDLORD________________________________________________Date:___________________'),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lease Agreement - ${data.property.address} - ${data.tenantName}.docx`);
}; 
export interface RentalAdProperty {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface RentalAdData {
  property: RentalAdProperty;
  price: number;
  availableDate: string;
  furnished: boolean;
  roommateNames: string[];
  privateParking: boolean;
  parkingPrice?: number;
}

const NINTH_AVE_ADDRESS = '503 E 9th Ave';

function ordinal(day: number): string {
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatAvailableDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = date.toLocaleString('en-US', { month: 'long' });
  return `${monthName} ${ordinal(day)}`;
}

export function formatRoommateList(names: string[]): string {
  const filtered = names.map((name) => name.trim()).filter(Boolean);

  if (filtered.length === 0) {
    return '';
  }
  if (filtered.length === 1) {
    return filtered[0];
  }
  if (filtered.length === 2) {
    return `${filtered[0]} and ${filtered[1]}`;
  }

  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

export function formatParkingLine(privateParking: boolean, parkingPrice?: number): string {
  if (!privateParking) {
    return 'Street parking available';
  }

  if (parkingPrice) {
    return `Private parking available for $${parkingPrice}`;
  }

  return 'Private parking available';
}

function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

export function generateRentalAd(data: RentalAdData): string | null {
  if (data.property.address !== NINTH_AVE_ADDRESS) {
    return null;
  }

  const roomPhrase = data.furnished ? 'Furnished room' : 'Private room';
  const roomBullet = data.furnished ? 'Furnished bedroom' : 'Private room';
  const availableDate = formatAvailableDate(data.availableDate);
  const price = formatPrice(data.price);
  const roommateList = formatRoommateList(data.roommateNames);
  const roommateSentence = roommateList
    ? `You’ll be sharing the house with ${roommateList}.`
    : 'You’ll be sharing the house with your roommates.';
  const parkingLine = formatParkingLine(data.privateParking, data.parkingPrice);

  return `${roomPhrase} available ${availableDate} in a spacious 5-bedroom, 3-bathroom Conshohocken townhouse with maid service for $${price}/month + utilities. Month-to-month lease. Applicant must be employed, a non-smoker, pet-free, and have a 700+ credit score.

We’re looking for one more roommate to join us. The home is on a quiet residential street right next to the East Conshohocken restaurant district, with easy access to restaurants, Spring Mill Station, King of Prussia, and Center City.

The Room
• ${roomBullet}
• Shared bathroom
• $${price}/month rent
• $140/month flat fee for utilities, internet, and monthly maid service of the common areas
• Month-to-month lease
• ${parkingLine}

The House
• Large kitchen
• Dishwasher
• Central AC and heat
• In-unit washer and dryer
• Outdoor deck
• Spacious common areas

The Roommates
${roommateSentence} Everyone is quiet, tidy, respectful, and generally keeps busy with work and their own lives.

It’s a comfortable, low-key household rather than a party house. Shared spaces are kept clean, dishes are cleaned up promptly, and everyone is considerate about noise and common areas.

Location
The house is within walking distance of Bar Lucca, Coyote Crossing, Conshohocken Brewing Company, and other restaurants and bars in East Conshohocken.

Spring Mill train station is about a 7-minute walk away, with service toward Manayunk and Center City.

By car, King of Prussia is about 12 minutes away and Center City Philadelphia is about 25 minutes away.

Rental Requirements
• Must be employed
• 700+ credit score
• Background and credit check required
• No smoking
• No pets

If interested, please message me with your expected move-in date and how long you’re looking to stay.

Thanks!`;
}

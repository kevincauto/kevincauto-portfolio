'use client';

import { useState } from 'react';
import styles from './LeaseEditorForm.module.css';
import FormInput from '../FormInput';
import { generateLease, LeaseData } from '@/lib/generateLease';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const properties: Property[] = [
  { id: 1, address: '900 E Hector St', city: 'Conshohocken', state: 'PA', zip: '19428' },
  { id: 2, address: '503 E 9th Ave', city: 'Conshohocken', state: 'PA', zip: '19428' },
  { id: 3, address: '224 Maple St', city: 'Conshohocken', state: 'PA', zip: '19428' },
];

export default function LeaseEditorForm() {
  const [selectedProperty, setSelectedProperty] = useState<Property>(properties[0]);
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    startDate: '',
    endDate: '',
    monthlyRent: '2000',
    securityDeposit: '2000',
    roomName: '',
    bathroom: '',
    maidService: false,
    privateParking: false,
  });
  const [dateError, setDateError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === 'tenantPhone') {
      const cleaned = ('' + value).replace(/\D/g, '');
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        let formatted = '';
        if (match[1]) formatted += `(${match[1]}`;
        if (match[2]) formatted += `) ${match[2]}`;
        if (match[3]) formatted += `-${match[3]}`;
        
        setFormData((prev) => ({
          ...prev,
          [name]: formatted,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    if (name === 'startDate' || name === 'endDate') {
      setDateError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      setDateError('End Date cannot be before Start Date.');
      return;
    }

    const leaseData: LeaseData = {
      property: selectedProperty,
      tenantName: formData.tenantName,
      tenantEmail: formData.tenantEmail,
      tenantPhone: formData.tenantPhone,
      startDate: formData.startDate,
      endDate: formData.endDate,
      monthlyRent: parseFloat(formData.monthlyRent) || 0,
      securityDeposit: parseFloat(formData.securityDeposit) || 0,
      roomName: formData.roomName,
      bathroom: formData.bathroom,
      maidService: formData.maidService,
      privateParking: formData.privateParking,
    };
    generateLease(leaseData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Select a Property</legend>
        <div className={styles.propertyToggle}>
          {properties.map((prop) => (
            <button
              key={prop.id}
              type="button"
              className={`${styles.toggleButton} ${
                selectedProperty.id === prop.id ? styles.active : ''
              }`}
              onClick={() => setSelectedProperty(prop)}
            >
              {prop.address}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Tenant Information</legend>
        <div className={styles.grid}>
          <FormInput label="Tenant Full Name" name="tenantName" onChange={handleInputChange} value={formData.tenantName} required />
          <FormInput label="Tenant Email" name="tenantEmail" type="email" placeholder="tenant@example.com" onChange={handleInputChange} value={formData.tenantEmail} required />
          <FormInput label="Tenant Phone Number" name="tenantPhone" type="tel" placeholder="(123) 456-7890" onChange={handleInputChange} value={formData.tenantPhone} maxLength={14} required />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Room Information</legend>
        <FormInput label="Room Name" name="roomName" placeholder="e.g., Second Floor Bedroom" onChange={handleInputChange} value={formData.roomName} required />
        <FormInput label="Bathroom" name="bathroom" placeholder="e.g., second floor shared bathroom" onChange={handleInputChange} value={formData.bathroom} required />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Lease Term & Financials</legend>
        <div className={styles.grid}>
          <FormInput label="Lease Start Date" name="startDate" type="date" onChange={handleInputChange} value={formData.startDate} required />
          <FormInput label="Lease End Date" name="endDate" type="date" onChange={handleInputChange} value={formData.endDate} required />
          <FormInput label="Monthly Rent" name="monthlyRent" type="number" placeholder="2000" onChange={handleInputChange} value={formData.monthlyRent} required />
          <FormInput label="Security Deposit" name="securityDeposit" type="number" placeholder="2000" onChange={handleInputChange} value={formData.securityDeposit} required />
        </div>
        {dateError && <p className={styles.errorText}>{dateError}</p>}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Added Amenities</legend>
        <div className={styles.checkboxGrid}>
          <div className={styles.checkboxWrapper}>
            <input type="checkbox" id="maidService" name="maidService" onChange={handleInputChange} checked={formData.maidService} />
            <label htmlFor="maidService">Maid Service</label>
          </div>
          <div className={styles.checkboxWrapper}>
            <input type="checkbox" id="privateParking" name="privateParking" onChange={handleInputChange} checked={formData.privateParking} />
            <label htmlFor="privateParking">Private Parking</label>
          </div>
        </div>
      </fieldset>

      <button type="submit" className={styles.button}>
        Generate Lease
      </button>
    </form>
  );
} 
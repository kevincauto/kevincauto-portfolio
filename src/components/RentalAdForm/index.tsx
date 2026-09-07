'use client';

import { useRef, useState } from 'react';
import styles from './RentalAdForm.module.css';
import FormInput from '../FormInput';
import { generateRentalAd } from '@/lib/generateRentalAd';

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

const NINTH_AVE_ID = 2;

export default function RentalAdForm() {
  const [selectedProperty, setSelectedProperty] = useState<Property>(
    properties.find((property) => property.id === NINTH_AVE_ID) ?? properties[0]
  );
  const [formData, setFormData] = useState({
    price: '',
    availableDate: '',
    furnished: true,
    roommateName1: '',
    roommateName2: '',
    roommateName3: '',
    roommateName4: '',
    privateParking: false,
    parkingPrice: '',
  });
  const [generatedAd, setGeneratedAd] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLTextAreaElement>(null);

  const markCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleFurnishedChange = (furnished: boolean) => {
    setFormData((prev) => ({ ...prev, furnished }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCopied(false);

    if (selectedProperty.id !== NINTH_AVE_ID) {
      setError('Ad copy for this property is not set up yet.');
      setGeneratedAd('');
      return;
    }

    const ad = generateRentalAd({
      property: selectedProperty,
      price: parseFloat(formData.price) || 0,
      availableDate: formData.availableDate,
      furnished: formData.furnished,
      roommateNames: [
        formData.roommateName1,
        formData.roommateName2,
        formData.roommateName3,
        formData.roommateName4,
      ],
      privateParking: formData.privateParking,
      parkingPrice: formData.parkingPrice ? parseFloat(formData.parkingPrice) : undefined,
    });

    if (!ad) {
      setError('Ad copy for this property is not set up yet.');
      setGeneratedAd('');
      return;
    }

    setError('');
    setGeneratedAd(ad);
  };

  const handleCopy = async () => {
    const textarea = previewRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }

    try {
      const copiedWithCommand = document.execCommand('copy');
      if (copiedWithCommand) {
        markCopied();
        return;
      }
    } catch {
      // Fall through to the clipboard API.
    }

    try {
      await navigator.clipboard.writeText(generatedAd);
      markCopied();
    } catch {
      // Text is already selected so it can be copied manually.
    }
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
              onClick={() => {
                setSelectedProperty(prop);
                setError('');
              }}
            >
              {prop.address}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Listing Details</legend>
        <div className={styles.grid}>
          <FormInput
            label="Price"
            name="price"
            type="number"
            placeholder="895"
            onChange={handleInputChange}
            value={formData.price}
            required
          />
          <FormInput
            label="Available Date"
            name="availableDate"
            type="date"
            onChange={handleInputChange}
            value={formData.availableDate}
            required
          />
        </div>

        <div>
          <p className={styles.fieldLabel}>Furnished?</p>
          <div className={styles.radioGrid}>
            <div className={styles.radioWrapper}>
              <input
                type="radio"
                id="furnishedYes"
                name="furnished"
                checked={formData.furnished}
                onChange={() => handleFurnishedChange(true)}
              />
              <label htmlFor="furnishedYes">Yes</label>
            </div>
            <div className={styles.radioWrapper}>
              <input
                type="radio"
                id="furnishedNo"
                name="furnished"
                checked={!formData.furnished}
                onChange={() => handleFurnishedChange(false)}
              />
              <label htmlFor="furnishedNo">No</label>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Roommates</legend>
        <div className={styles.grid}>
          <FormInput
            label="Roommate Name 1"
            name="roommateName1"
            placeholder="Sarah"
            onChange={handleInputChange}
            value={formData.roommateName1}
          />
          <FormInput
            label="Roommate Name 2"
            name="roommateName2"
            placeholder="Katie"
            onChange={handleInputChange}
            value={formData.roommateName2}
          />
          <FormInput
            label="Roommate Name 3"
            name="roommateName3"
            placeholder="Lindsey"
            onChange={handleInputChange}
            value={formData.roommateName3}
          />
          <FormInput
            label="Roommate Name 4"
            name="roommateName4"
            placeholder="Kartik"
            onChange={handleInputChange}
            value={formData.roommateName4}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Parking</legend>
        <div className={styles.checkboxGrid}>
          <div className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              id="privateParking"
              name="privateParking"
              onChange={handleInputChange}
              checked={formData.privateParking}
            />
            <label htmlFor="privateParking">Private Parking Available?</label>
          </div>
        </div>
        {formData.privateParking && (
          <div className={styles.grid} style={{ marginTop: '1rem' }}>
            <FormInput
              label="Parking Price (optional)"
              name="parkingPrice"
              type="number"
              placeholder="100"
              onChange={handleInputChange}
              value={formData.parkingPrice}
            />
          </div>
        )}
      </fieldset>

      <button type="submit" className={styles.button}>
        Generate Ad
      </button>
      {error && <p className={styles.errorText}>{error}</p>}

      {generatedAd && (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Generated Ad</legend>
          <div className={styles.previewHeader}>
            <button
              type="button"
              className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            ref={previewRef}
            className={styles.previewTextarea}
            value={generatedAd}
            onChange={(e) => {
              setGeneratedAd(e.target.value);
              setCopied(false);
            }}
            aria-label="Generated rental ad"
          />
        </fieldset>
      )}
    </form>
  );
}

import Image from 'next/image';
import { useState } from 'react';

interface PokemonIconProps {
  species: string;
}

const PokemonIcon: React.FC<PokemonIconProps> = ({ species }) => {
  const getImageUrl = (name: string) => {
    // Converts a species name like "Mr. Mime" or "Type: Null" into a URL-friendly format like "mr-mime" or "type-null".
    const formattedName = name
      .toLowerCase()
      .replace(/'|\./g, '') // remove apostrophes and periods
      .replace(/ |:/g, '-')   // replace spaces and colons with hyphens
      .replace('♀', '-f')
      .replace('♂', '-m');

    // The API that provides the data for the table aggregates different forms (e.g. Florges-Blue) 
    // into the base species name (Florges), so we don't need to handle form suffixes here.
    return `https://img.pokemondb.net/sprites/sword-shield/icon/${formattedName}.png`;
  };

  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(species);
  
  if (error) {
    return null; // Don't render anything if the image fails to load
  }

  return (
    <Image
      src={imageUrl}
      alt={species}
      width={36}
      height={36}
      style={{
        marginRight: '8px',
        verticalAlign: 'middle',
      }}
      onError={() => setError(true)}
    />
  );
};

export default PokemonIcon;

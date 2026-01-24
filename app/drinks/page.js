import DrinksList from '@/components/DrinksList';
import React from 'react'
const url = "https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a";

const fetchDrinks = async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Error Fetch drinks')
  }
  const data = await response.json();
  return data
}

const Drinks = async () => {
  const data = await fetchDrinks();
  return (
    <div>
      <DrinksList drinks={data.drinks}></DrinksList>
    </div>
  )
}

export default Drinks
import React from 'react'
const url = 'https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=';
import Link from 'next/link'
import MeImg from "./me.jpg"
import Image from 'next/image';

const
    getSingleDrink = async (id) => {
        const res = await fetch(`${url}${id}`);
        if (!res.ok) {
            throw new Error('Failed to fetch a drink...');
        }
        return res.json();
    }


const DrinkPage = async ({ params }) => {

    const data = await getSingleDrink(params.id);
    const title = data?.drinks[0]?.strDrink
    const imgSrc = data?.drinks[0]?.strDrinkThumb
    return (
        <div><Link href='/drinks' className='btn btn-primary mt-8 mb-12'>
            back to drinks
        </Link>
            <Image src={imgSrc} alt='title' height={300} width={300} sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw' priority className='w-48 h-48 shadow-lg'></Image>
            {/* <Image src={MeImg} className="w-48 h-48 rounded-lg" /> */}
            <h1 className='text-4xl mb-8'>{title}</h1>
        </div>
    )
}

export default DrinkPage
import Link from 'next/link'
import React from 'react'

const Homepage = () => {
  return (
    <div>
      <h1 className='text-5xl mb-8 font-bold'>Next js tutorial</h1>
      <Link href={'/client'} className='btn btn-accent'>Get Started</Link>
    </div>
  )
}

export default Homepage
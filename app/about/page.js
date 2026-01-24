import Link from 'next/link'
import React from 'react'

const AboutPage = () => {
  return (
    <div>
      <h1 className='text-5xl mb-8 font-bold'>AboutPage</h1>
      <Link href={'/client'} className='btn btn-accent'>Homepage</Link>
    </div>
  )
}

export default AboutPage
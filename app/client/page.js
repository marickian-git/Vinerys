'use client'
import React, { useState } from 'react'

const ClientPage = () => {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1 className='text-5xl'>{count}</h1>
      <button className='btn btn-primary' onClick={() => { setCount(count + 1) }}>Incrase</button>

    </div>
  )
}

export default ClientPage
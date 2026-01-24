'use client'

import React from 'react'

const error = (err) => {
    return (
        <div>{err.error.message}</div>
    )
}

export default error
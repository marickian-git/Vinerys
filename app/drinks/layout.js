import React from 'react'

const LayoutDrinks = ({ children }) => {
    return (
        <div className='max-w-xl'>
            <div className='mockup-code mb-8'>
                <pre>
                    <code>create nested layout</code>
                </pre>
            </div>
            {children}
        </div>
    )
}

export default LayoutDrinks
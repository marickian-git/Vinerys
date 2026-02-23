'use client'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs';


const Providers = ({ children }) => {
    return (
        <>
         <ClerkProvider><Toaster />{children}</ClerkProvider></>
    )
}

export default Providers
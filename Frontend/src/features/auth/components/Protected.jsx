import React from 'react'
import {useSelector} from "react-redux"
import {Navigate} from "react-router"
import KineticTextLoader from '../../../components/ui/kinetic-text-loader'

const Protected = ({children}) => {

    const user = useSelector((state) => state.auth.user);  
    const loading = useSelector((state) => state.auth.loading); 
    const sessionChecked = useSelector((state) => state.auth.sessionChecked);

    if(!sessionChecked || loading){
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[color:var(--bg-app)] text-[color:var(--text-primary)]">
                <KineticTextLoader text="LOADING" />
            </div>
        )
    }

    if(!user){
        return <Navigate to="/login" replace />  
        
    }
  return children;  
}

export default Protected

import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",        
    initialState:{      
        user:null,
        loading:false,
        error:null,
        sessionChecked:false,
    },
    reducers:{   
        setUser:(state, action) => {   
            state.user = action.payload   
        },
        setLoading:(state, action) => {
            state.loading = action.payload
        },
        setError:(state, action) => {
            state.error = action.payload
        },
        setSessionChecked:(state, action) => {
            state.sessionChecked = action.payload
        }
    }
})   

export const { setUser, setLoading, setError, setSessionChecked } = authSlice.actions   // export the actions to be used in the components to update the state of the authentication slice

export default authSlice.reducer

import {configureStore} from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice.js"
import chatReducer from "../features/chat/chat.slice.js"


export const store = configureStore({   
    reducer:{      // different slices of state will be added here in the future
        auth:authReducer,
        chat:chatReducer,
    }
})
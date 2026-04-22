import { getAccessToken } from "./authService";

export const getProfile= async (setFormMessage) => {
    try{
        const res= await fetch("http://127.0.0.1:8080/profile/",{
            method: "GET",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setFormMessage)}`,
            },
            credentials: "include",
        });

        return res
    }catch(error){
        throw error;
    }
}

export const changePassword= async (data, setFormMessage) => {
    try{
        const res= await fetch("http://127.0.0.1:8080/profile/change-password", {
            method: "PATCH",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setFormMessage)}`
            },
            credentials: "include",
            body: data
        });

        return res
    }catch(error){
        throw error;
    }
}

export const editAvatar= async (data, setFormMessage) => {
    try{
        const res= await fetch("http://127.0.0.1:8080/profile/avatar", {
            method: "PATCH",
            headers: { 
                "Authorization": `Bearer ${await getAccessToken(setFormMessage)}`
            }, //the Content-Type will be by default multipart/form-data due to the file field
            credentials: "include",
            body: data
        });

        return res
    }catch(error){
        throw error;
    }
}

export const editProfile= async (data, setFormMessage) => {
    try{
        const res= await fetch("http://127.0.0.1:8080/profile/edit", {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${await getAccessToken(setFormMessage)}`,
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        return res
    }catch(error){
        throw error;
    }
}

export const deleteProfile= async (setFormMessage) => {
    try{
        const res= await fetch("http://127.0.0.1:8080/profile/delete", {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setFormMessage)}`
            },
            credentials: "include"
        });

        return res
    }catch(error){
        throw error;
    }
}
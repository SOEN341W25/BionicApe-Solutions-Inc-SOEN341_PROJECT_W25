import axios from "axios";

export const axiosInstance = axios.create({
    baseURL:"http://localchost:3000/api",
    withCredentials:true,

});
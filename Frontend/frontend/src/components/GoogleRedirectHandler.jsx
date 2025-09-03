import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GOOGLE_ACCESS_TOKEN, ACCESS_TOKEN } from "../token"; // ✅ import both token keys

function RedirectGoogleAuth() {
    const navigate = useNavigate();

    useEffect(() => {
        console.log("RedirectHandler mounted successfully");

        const queryParams = new URLSearchParams(window.location.search);
        const accessToken = queryParams.get('access_token');
        console.log("QueryParams: ", window.location.search);

        if (accessToken) {
            console.log("AccessToken found: ", accessToken);

            // ✅ Store token both as GOOGLE_ACCESS_TOKEN and ACCESS_TOKEN
            localStorage.setItem(GOOGLE_ACCESS_TOKEN, accessToken);
            localStorage.setItem(ACCESS_TOKEN, accessToken); // ✅ critical for uploads and other auth APIs

            // ✅ Use it immediately to verify the user with your backend
            axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
            axios.get('http://localhost:8000/api/auth/user/')
                .then(response => {
                    console.log('User data:', response.data);
                    navigate('/');
                })
                .catch(error => {
                    console.error('Error verifying token:', error.response ? error.response.data : error.message);
                    navigate('/login');
                });
        } else {
            console.log('No token found in URL');
            navigate('/login');
        }
    }, [navigate]);

    return <div>Logging In.........</div>;
}

export default RedirectGoogleAuth;

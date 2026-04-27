import axios from 'axios';

const publicAxios = axios.create(); // withCredentials is false by default

export default publicAxios;
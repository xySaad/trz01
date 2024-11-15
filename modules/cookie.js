// cookie.js
let cookie = ""; // Module-level variable

const setCookie = (newCookie) => {
  cookie = newCookie; // Function to update the cookie
};

const getCookie = () => cookie; // Function to retrieve the current cookie

export { setCookie, getCookie };

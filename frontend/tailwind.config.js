/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f4c81",
        secondary: "#4d6b3c",
        accent: "#c97b2b"
      }
    }
  },
  plugins: []
};

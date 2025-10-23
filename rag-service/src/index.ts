import app from "./app.js" ;
import * as dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`) ;
}) ;
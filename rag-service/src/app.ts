import express from "express" ;
import cors from "cors" ;
import { storeDocumentRoute } from "./routes/storeDocumentRoutes.js" ;


const app = express() ;
app.use(express.json()) ;

const corsOptions = {
    origin: "http://localhost:5173" ,
    methods:["GET", "POST", "PUT", "DELETE"] ,
    allowedHeaders:["Content-Type", "Authorization"]
} ;
app.use(cors(corsOptions)) ;
app.use("/store-document", storeDocumentRoute);
export default app ;
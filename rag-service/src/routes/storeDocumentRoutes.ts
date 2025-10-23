import express , {Request,Response,Router} from "express"
import { storeDocument } from "../services/storeDocumentService.js"
const router:Router = express.Router() ;

router.post("/", async (req:Request, res:Response) => {
    try {
        const result = await storeDocument(req) ;
        res.status(200).json(result) ;
    } catch (error) {
        res.status(500).json({ error: "Failed to store document" }) ;
    }
}) ;

export { router as storeDocumentRoute } ;
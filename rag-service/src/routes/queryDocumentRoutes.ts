import { Router } from 'express';
import { queryDocument } from '../services/queryDocumentService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { query, conversationId, documentIds } = req.body;
    const result = await queryDocument(query, conversationId, documentIds);
    res.json(result);
  } catch (error) {
    console.error('Error in /query-document route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
});

export default router;

import { Router } from 'express';
import { parseDocument, getDocuments, deleteDocument, deleteAllDocuments } from './document.controller';

const router = Router();

// GET /api/v1/documents - List all parsed documents from database
router.get('/', getDocuments);

// POST /api/v1/documents/parse - Parse PDF/CSV/Text document and store in DB
router.post('/parse', parseDocument);

// DELETE /api/v1/documents/:id - Delete a specific document by ID
router.delete('/:id', deleteDocument);

// DELETE /api/v1/documents - Delete all documents
router.delete('/', deleteAllDocuments);

export default router;

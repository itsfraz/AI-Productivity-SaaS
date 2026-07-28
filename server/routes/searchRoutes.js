import express from 'express';
import { semanticSearch } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', semanticSearch);

export default router;

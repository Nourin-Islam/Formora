import express from 'express';
import { prisma } from '../lib/prisma.ts';

const router = express.Router();

// Full-text search
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    // PostgreSQL full-text search
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { title: { search: query } },
          { description: { search: query } },
          { questions: { some: { title: { search: query } } } },
          { questions: { some: { description: { search: query } } } },
          { tags: { some: { tag: { name: { search: query } } } }
        ],
        isPublic: true
      },
      include: {
        user: { select: { name: true } },
        topic: true,
        tags: { include: { tag: true } },
        _count: { select: { forms: true } }
      }
    });

    res.json(templates);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
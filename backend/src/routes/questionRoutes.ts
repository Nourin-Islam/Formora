import express from 'express';
import { protectedRoute } from '../middleware/auth.ts';
import { prisma } from '../lib/prisma.ts';

const router = express.Router();

// Add question to template
router.post('/:templateId', protectedRoute, async (req, res) => {
  try {
    const { title, description, questionType, showInTable, options } = req.body;
    const templateId = parseInt(req.params.templateId);

    // Verify template ownership
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get current max position
    const maxPosition = await prisma.question.aggregate({
      where: { templateId },
      _max: { position: true }
    });

    const question = await prisma.question.create({
      data: {
        templateId,
        title,
        description,
        questionType,
        showInTable,
        options,
        position: (maxPosition._max.position || 0) + 1
      }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Reorder questions
router.patch('/:templateId/reorder', protectedRoute, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const templateId = parseInt(req.params.templateId);

    // Verify template ownership
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update positions in transaction
    await prisma.$transaction(
      orderedIds.map((id: number, index: number) => 
        prisma.question.update({
          where: { id },
          data: { position: index + 1 }
        })
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
});

export default router;
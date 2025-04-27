import express from 'express';
import { getAnnotation, voteOnAnnotation, explainLyric } from '../controllers/annotationController';

const router = express.Router();

/**
 * @route   POST /api/annotations/explain
 * @desc    Explain a specific lyric line in the context of full lyrics
 * @access  Public
 */
router.post('/explain', explainLyric);

/**
 * @route   GET /api/annotations/track/:trackId
 * @desc    Get an annotation for a specific lyric line
 * @access  Public
 */
router.get('/track/:trackId', getAnnotation);

/**
 * @route   POST /api/annotations/:annotationId/vote
 * @desc    Vote on an annotation (upvote or downvote)
 * @access  Public
 */
router.post('/:annotationId/vote', voteOnAnnotation);

export default router; 
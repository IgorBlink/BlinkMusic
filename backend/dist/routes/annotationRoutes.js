"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const annotationController_1 = require("../controllers/annotationController");
const router = express_1.default.Router();
/**
 * @route   POST /api/annotations/explain
 * @desc    Explain a specific lyric line in the context of full lyrics
 * @access  Public
 */
router.post('/explain', annotationController_1.explainLyric);
/**
 * @route   GET /api/annotations/track/:trackId
 * @desc    Get an annotation for a specific lyric line
 * @access  Public
 */
router.get('/track/:trackId', annotationController_1.getAnnotation);
/**
 * @route   POST /api/annotations/:annotationId/vote
 * @desc    Vote on an annotation (upvote or downvote)
 * @access  Public
 */
router.post('/:annotationId/vote', annotationController_1.voteOnAnnotation);
exports.default = router;

import express from 'express';
import { upload } from '../config/multer.js';
import {
  getIssues,
  getIssueById,
  createIssue,
  updateStatus,
  upvoteIssue,
  addComment,
  getNearbyIssues,
  reverseGeocode,
} from '../controllers/issueController.js';

const router = express.Router();

router.get('/', getIssues);
router.get('/nearby', getNearbyIssues);
router.get('/reverse-geocode', reverseGeocode);
router.get('/:id', getIssueById);
router.post('/', upload.single('photo'), createIssue);
router.patch('/:id/status', updateStatus);
router.post('/:id/upvote', upvoteIssue);
router.post('/:id/comments', addComment);

export default router;


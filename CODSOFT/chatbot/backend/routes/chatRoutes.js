import express from "express";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected by JWT authentication middleware
router.use(protect);

router.route("/conversations").get(getConversations).post(createConversation);
router.route("/conversations/:id").delete(deleteConversation);
router.route("/messages/:conversationId").get(getMessages);
router.route("/chat").post(sendMessage);

export default router;

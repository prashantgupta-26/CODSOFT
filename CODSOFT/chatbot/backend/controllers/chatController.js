import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { generateAIResponse } from "../services/aiService.js";

/**
 * @desc    Get all conversations of logged-in user
 * @route   GET /api/conversations
 * @access  Private
 */
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new conversation
 * @route   POST /api/conversations
 * @access  Private
 */
export const createConversation = async (req, res, next) => {
  const { title } = req.body;

  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: title || "New Conversation",
    });

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all messages for a specific conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = async (req, res, next) => {
  const { conversationId } = req.params;

  try {
    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found or access denied");
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message, trigger AI, and auto-save both messages
 * @route   POST /api/chat
 * @access  Private
 */
export const sendMessage = async (req, res, next) => {
  let { conversationId, text } = req.body;

  try {
    if (!text || text.trim() === "") {
      res.status(400);
      throw new Error("Message text cannot be empty");
    }

    let conversation;

    // If no conversationId is provided, create a new conversation automatically
    if (!conversationId) {
      const generatedTitle =
        text.length > 30 ? `${text.substring(0, 27)}...` : text;

      conversation = await Conversation.create({
        userId: req.user._id,
        title: generatedTitle,
      });
      conversationId = conversation._id;
    } else {
      // Verify conversation belongs to user
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user._id,
      });

      if (!conversation) {
        res.status(404);
        throw new Error("Conversation not found or access denied");
      }
    }

    // 1. Save user message to database
    const userMessage = await Message.create({
      conversationId,
      sender: "user",
      text,
    });

    // 2. Fetch history of previous messages (excluding current message to keep context clean)
    const history = await Message.find({
      conversationId,
      _id: { $ne: userMessage._id },
    }).sort({ createdAt: 1 });

    // 3. Generate AI response (using history for context + the current text prompt)
    let aiResponseText;
    try {
      aiResponseText = await generateAIResponse(history, text);
    } catch (aiError) {
      console.error("AI Generation failed, saving fallback:", aiError.message);
      aiResponseText = "I encountered an error generating a response. Please check your system settings or try again.";
    }

    // 4. Save AI response to database
    const aiMessage = await Message.create({
      conversationId,
      sender: "ai",
      text: aiResponseText,
    });

    // 5. Update conversation timestamp
    conversation.updatedAt = Date.now();
    await conversation.save();

    res.json({
      conversationId,
      conversationTitle: conversation.title,
      userMessage,
      aiMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a conversation and its messages
 * @route   DELETE /api/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res, next) => {
  const { id } = req.params;

  try {
    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found or access denied");
    }

    // Delete all messages associated with the conversation
    await Message.deleteMany({ conversationId: id });

    // Delete conversation
    await conversation.deleteOne();

    res.json({ message: "Conversation and messages deleted successfully" });
  } catch (error) {
    next(error);
  }
};

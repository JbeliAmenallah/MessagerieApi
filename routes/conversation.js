const router = require("express").Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

//new conv

router.post("/", async (req, res) => {
    const newConversation = new Conversation({
        members: req.body?.senderId && req.body?.receiverId ? [req.body.senderId, req.body.receiverId] : [],
      });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
    console.log(err)
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation)
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/:conversationId/images", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      type: 'image',
    }).select('fileUrl'); 
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

module.exports = router;
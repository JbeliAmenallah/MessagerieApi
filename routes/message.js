const router = require("express").Router();
const Message = require("../models/Message");
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 1MB file size limit
  // fileFilter: function(req, file, cb){
  //   checkFileType(file, cb);
  // }
}).single('file'); // 'file' is the key for the file in the form-data

// Check File Type
// const filetypes = /\.(jpeg|jpg|png|gif|pdf|doc|docx|mp3|wav|ogg|m4a|aac)$/i;

// function checkFileType(file, cb) {
//   // Check ext
//   const extname = filetypes.test(path.extname(file.originalname));

//   if (extname) {
//     return cb(null, true);
//   } else {
//     cb('Error: Images, Documents, and Audio Only!');
//   }
// }

module.exports = (io) => {
  // Add message
  router.post("/", async (req, res) => {
    upload(req, res, async (err) => {
      if(err){
        return res.status(500).json({ error: err });
      }

      const { conversationId, sender, text , type} = req.body;
      const newMessage = new Message({
        conversationId,
        sender,
        text: text || null,
        fileUrl: req.file ? `uploads/${req.file.filename}` : null,
        type
      });

      try {
        const savedMessage = await newMessage.save();
        io.emit('receiveMessage', savedMessage);  // Emit the saved message to all connected clients
        res.status(200).json(savedMessage);
      } catch (err) {
        res.status(500).json(err);
      }
    });
  });

  // Get messages
  router.get("/:conversationId", async (req, res) => {
    try {
      const messages = await Message.find({
        conversationId: req.params.conversationId,
      });
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json(err);
    }
  });



  router.get("/:conversationId/last", async (req, res) => {
    try {
      const lastMessage = await Message.findOne({ conversationId: req.params.conversationId })
        .sort({ createdAt: -1 }); // Sort by creation date in descending order
      if (!lastMessage) {
        return res.status(404).json({ message: "No messages found" });
      }
      res.status(200).json(lastMessage);
    } catch (err) {
      res.status(500).json(err);
    }
  });


  router.put("/mark-seen", async (req, res) => {
    const { conversationId, userId } = req.body;
    try {
      await Message.updateMany(
        { conversationId, sender: { $ne: userId }, seen: false },
        { $set: { seen: true } }
      );
      io.emit('messagesSeen', { conversationId, userId });
      res.status(200).send();
    } catch (err) {
      res.status(500).json(err);
    }
  });

  return router;
};

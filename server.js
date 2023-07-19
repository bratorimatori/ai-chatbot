require('dotenv').config();
const express = require('express');
const http = require('node:http');
const socketIO = require('socket.io');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 3000;

// OpenAI API configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Serve static files form the public folder
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New user connected');

  // Initialize the conversation history
  const conversationHistory = [];

  socket.on('sendMessage', async (message, callback) => {
    console.log(`sendMessage: ${message}`);
    try {
      // Add the user message to the conversation history
      conversationHistory.push({ role: 'user', content: message });

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationHistory,
      });

      const response = completion.data.choices[0].message.content;

      // Add the assistant's response to the conversation history
      conversationHistory.push({ role: 'assistant', content: response });

      socket.emit('message', response);
      callback();
    } catch (error) {
      console.error(error);
      callback(`Error: Unable to connect to the chatbot ${error}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

# **App Name**: Nova Chat

## Core Features:

- Logo Header: Display the AI's name "Nova" as a header/logo in the top-left corner.
- User Message Display: Display user messages aligned to the right in blue/green bubbles.
- Bot Message Display: Display bot messages (from Nova) aligned to the left in white/gray bubbles.
- Text Input Field: Implement a text input field at the bottom for typing messages with a "Send" button.
- Message Sending: When the user types a message and clicks Send, the message should be sent via a POST request using JavaScript fetch() to the backend endpoint. This sends JSON { "message": "your text" } and receives { "response": "chatbot reply" }.
- Typing Indicator: Show a typing indicator (like "Nova is thinking...") while waiting for a response from the backend.
- Dark Mode Toggle: Implement a Dark Mode toggle at the top-right corner for switching between light and dark themes.

## Style Guidelines:

- Primary color: A pastel periwinkle (#A0B4F3) for calm and friendly interaction.
- Background color: A very light desaturated gray (#F5F5F5) for a clean, light theme.
- Accent color: A soft lavender (#D0B4F3) to highlight interactive elements.
- Dark theme background: Dark gray/black (#121212) with neon blue or green (#00FF7F) highlights for text and buttons.
- Clean and modern font.
- Central chat window with a scrollable message area for displaying conversations.
- Smooth, subtle fade-in animations for new messages and slight hover effects on buttons.
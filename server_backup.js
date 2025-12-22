// JavaScript source code
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Server statiske filer fra "public"-mappen
app.use(express.static(path.join(__dirname, 'public')));

// Server HTML-siden
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
});

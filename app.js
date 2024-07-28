const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // To handle cross-origin requests

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://admin:123@cluster0.p5ixbap.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
const db = mongoose.connection;
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define the Post model
const postSchema = new mongoose.Schema({
    imagePath: String,
    caption: String,
    date: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

// Define the User model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Middleware for verifying JWT
function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// User registration
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword
    });

    newUser.save()
        .then(user => res.json({ message: 'User created' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
});

// Create (Upload) a new post
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    const { caption } = req.body;
    const newPost = new Post({
        imagePath: `/uploads/${req.file.filename}`,
        caption,
    });

    newPost.save()
        .then(post => res.json(post))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Read all posts
app.get('/api/posts', authenticateToken, (req, res) => {
    Post.find()
        .then(posts => res.json(posts))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Read a single post by ID
app.get('/api/posts/:id', authenticateToken, (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Update a post by ID
app.put('/api/posts/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { caption } = req.body;
    const updateData = { caption };

    if (req.file) {
        updateData.imagePath = `/uploads/${req.file.filename}`;
    }

    Post.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .then(post => res.json(post))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Delete a post by ID
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.json({ message: 'Post deleted' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Visit http://localhost:${port} to view the site`);
});

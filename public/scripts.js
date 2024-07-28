document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadForm = document.getElementById('uploadForm');
    const postsContainer = document.getElementById('posts');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const toggleLayoutBtn = document.getElementById('toggle-layout');
    const layoutConfig = document.getElementById('layout-config');
    const postsPerRowInput = document.getElementById('posts-per-row');
    const postSizeInput = document.getElementById('post-size');
    const postsPerRowValue = document.getElementById('posts-per-row-value');
    const postSizeValue = document.getElementById('post-size-value');

    let token = localStorage.getItem('token');

    if (token) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        uploadForm.style.display = 'block';
        fetchPosts();
    } else {
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        uploadForm.style.display = 'none';
    }

    loginBtn.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    });

    signupBtn.addEventListener('click', () => {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        location.reload();
    });

    document.getElementById('login-submit').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('token', result.token);
                location.reload();
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    document.getElementById('signup-submit').addEventListener('click', async () => {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (response.ok) {
                alert('User created, please login.');
                signupForm.style.display = 'none';
                loginForm.style.display = 'block';
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(uploadForm);
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': token },
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                displayPost(result);
                uploadForm.reset();
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts', {
                headers: { 'Authorization': token }
            });
            const posts = await response.json();
            posts.forEach(post => displayPost(post));
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayPost(post) {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.dataset.id = post._id;
        postElement.innerHTML = `
            <img src="${post.imagePath}" alt="Post image">
            <p>${post.caption}</p>
            <button onclick="editPost('${post._id}')">Edit</button>
            <button onclick="deletePost('${post._id}')">Delete</button>
        `;
        postsContainer.appendChild(postElement);
    }

    window.editPost = function (postId) {
        const postElement = postsContainer.querySelector(`[data-id="${postId}"]`);
        const caption = postElement.querySelector('p').textContent;
        const updateForm = document.createElement('form');
        updateForm.innerHTML = `
            <input type="text" name="caption" value="${caption}">
            <button type="submit">Update</button>
        `;
        updateForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(updateForm);
            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': token },
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    postElement.querySelector('p').textContent = result.caption;
                    updateForm.remove();
                } else {
                    console.error(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
        postElement.appendChild(updateForm);
    };

    window.deletePost = async function (postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            if (response.ok) {
                const postElement = postsContainer.querySelector(`[data-id="${postId}"]`);
                postElement.remove();
            } else {
                console.error('Failed to delete post.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    toggleLayoutBtn.addEventListener('click', () => {
        layoutConfig.style.display = layoutConfig.style.display === 'none' ? 'block' : 'none';
    });

    postsPerRowInput.addEventListener('input', () => {
        const postsPerRow = postsPerRowInput.value;
        postsPerRowValue.textContent = postsPerRow;
        postsContainer.style.gridTemplateColumns = `repeat(${postsPerRow}, 1fr)`;
    });

    postSizeInput.addEventListener('input', () => {
        const postSize = postSizeInput.value;
        postSizeValue.textContent = postSize;
        const postElements = document.querySelectorAll('.post');
        postElements.forEach(post => {
            post.style.width = `${postSize}%`;
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadForm = document.getElementById('uploadForm');
    const postsContainer = document.getElementById('posts');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

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
        postElement.className = 'post';
        postElement.dataset.id = post._id;
        postElement.innerHTML = `
            <img src="${post.imagePath}" alt="Post Image">
            <p>${post.caption}</p>
            <button class="update-btn" data-id="${post._id}">Update</button>
            <button class="delete-btn" data-id="${post._id}">Delete</button>
        `;
        postsContainer.prepend(postElement);

        postElement.querySelector('.update-btn').addEventListener('click', () => showUpdateForm(post));
        postElement.querySelector('.delete-btn').addEventListener('click', () => deletePost(post._id));
    }

    function showUpdateForm(post) {
        const updateForm = document.createElement('form');
        updateForm.className = 'update-form';
        updateForm.innerHTML = `
            <input type="file" name="image" id="update-image">
            <input type="text" name="caption" id="update-caption" value="${post.caption}" required>
            <button type="submit">Save</button>
            <button type="button" class="cancel-btn">Cancel</button>
        `;

        const postElement = document.querySelector(`.post[data-id="${post._id}"]`);
        postElement.appendChild(updateForm);

        updateForm.addEventListener('submit', (event) => updatePost(event, post._id, updateForm));
        updateForm.querySelector('.cancel-btn').addEventListener('click', () => updateForm.remove());
    }

    function updatePost(event, postId, form) {
        event.preventDefault();
        const formData = new FormData(form);

        fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Authorization': token },
            body: formData
        })
        .then(response => response.json())
        .then(updatedPost => {
            const postElement = document.querySelector(`.post[data-id="${updatedPost._id}"]`);
            postElement.querySelector('img').src = updatedPost.imagePath;
            postElement.querySelector('p').innerText = updatedPost.caption;
            form.remove();
        })
        .catch(error => console.error('Error:', error));
    }

    function deletePost(postId) {
        fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        })
        .then(() => {
            document.querySelector(`.post[data-id="${postId}"]`).remove();
        })
        .catch(error => console.error('Error:', error));
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

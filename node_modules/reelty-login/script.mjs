fetch('https://reqres.in/api/users')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error("Error:", err));
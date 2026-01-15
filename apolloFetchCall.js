const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'x-api-key': 'API_KEY_HERE'
    },
    body: JSON.stringify({sort_ascending: false})
  };
  
  fetch('https://api.apollo.io/api/v1/contacts/search', options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));
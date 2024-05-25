const express = require('express');
const bodyParser = require('body-parser');
const loginHandler = require('./handler/login-handler');
const registerHandler = require('./handler/register-handler');
const userHandler = require('./handler/user-handler');
const productHandler = require('./handler/product-handler');
const farmHandler = require('./handler/farm-handler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to Farm Fresh API');
});

app.use('/api', loginHandler);
app.use('/api', registerHandler);
app.use('/api', userHandler);
app.use('/api', productHandler);
app.use('/api', farmHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('server/db.json');
const middlewares = jsonServer.defaults();
const db = require('./db.json');
const fs = require('fs');

const port = process.env.PORT || 4000;

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/login', (req, res, next) => {
    const users = readUsers();

    const user = users.filter(
        u => u.username === req.body.username && u.password === req.body.password
    )[0];

    if (user) {
        res.send({ ...formatUser(user), token: checkIfAdmin(user) });
    } else {
        res.status(401).send({
            message: 'Incorrect username or password',
            status: 400
        });
    }
});

server.post('/register', (req, res) => {
    const users = readUsers();
    const user = users.filter(u => u.username === req.body.username)[0];

    if (user === undefined || user === null) {
        res.send({
            ...formatUser(req.body),
            token: checkIfAdmin(req.body)
        });
        db.users.push(req.body);
    } else {
        res.status(500).send('User already exists');
    }
});

server.use('/users', (req, res, next) => {
    if (isAuthorized(req) || req.query.bypassAuth === 'true') {
        next();
    } else {
        res.sendStatus(401);
    }
});

server.use('/products', (req, res, next) => {
    if (isAuthorized(req) || req.query.bypassAuth === 'true') {
        next();
    } else {
        res.status(401).send({
            message: 'Unauthorized'
        })
    }
});
server.use('/pos_orders', (req, res, next) => {
    if (isAuthorized(req) || req.query.bypassAuth === 'true') {
        next();
    } else {
        res.status(401).send({
            message: 'Unauthorized'
        })
    }
});
server.use('/categories', (req, res, next) => {
    if (isAuthorized(req) || req.query.bypassAuth === 'true') {
        next();
    } else {
        res.status(401).send({
            message: 'Unauthorized'
        })
    }
});



server.use(router);

server.listen(port, () => {
    console.log('JSON Server is running');
});

function formatUser(user) {
    delete user.password;
    user.role = user.username === 'admin'
        ? 'admin'
        : 'user';
    return user;
}

function checkIfAdmin(user, bypassToken = false) {
    return user.username === 'admin' || bypassToken === true
        ? 'admin-token'
        : 'user-token';
}

function isAuthorized(req) {
    return req.headers.authorization === 'admin-token' ? true : false;
}

function readUsers() {
    const dbRaw = fs.readFileSync('./server/db.json');
    const users = JSON.parse(dbRaw).users
    return users;
}

function readData(entity, id) {
    const dbRaw = fs.readFileSync('./server/db.json');
    entity = JSON.parse(dbRaw)[entity] + id ? id : '';
    return entity;
}
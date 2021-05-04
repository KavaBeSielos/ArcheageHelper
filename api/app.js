const express = require('express');
const app = express();

const { mongoose } = require('./db/mongoose');

const bodyParser = require('body-parser');

// Load in the mongoose models
const { List, Task, User } = require('./db/models');
const  jwt  = require('jsonwebtoken');


/*  MIDDLEWARE  */

// Load middleware
// dont use json() without () IT WILL BREAK THE WHOLE PROGRAM :)
app.use(bodyParser.json());

// CORS HEADER MIDDLEWARE
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
     // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    // when loging in to get back headers because on default they are hidden
    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
  });

//check if the request has a valid JWT access token
let authenticate = (req,res,next) => {
    let token = req.header('x-access-token');

    //verify jwt 
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if(err){
            // there was an error
            // jwt is invalid so do not authentificate
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    })
}


//Verify refresh token middleware (which will be veryfing the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user){
            //no user found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }

        //The user was found so we have to check token if its expired or not
        req.user_id= user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if(session.token === refreshToken) {
                //check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    //refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // Session is VALID so we call next() to continue processing web request
            next();
        } else {
            //the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }
    }).catch((e) => {
        res.status(401).send(e);
    })
}


/* ROUTE HANDLERS */


/* LIST ROUTES */

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get('/lists', authenticate, (req, res) => {
    //we want to return an array of all the lists in db that belong to user and hes id
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
});


/**
 * POST /lists
 * Purpose: Create a list
 */
app.post('/lists', authenticate, (req, res) => {
    //we want to create a new list and return the new list back to the user ( which includes the id)
    //The list information (fields) will be passed in via the JSON request body
    let title = req.body.title;

    let newList = new List({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        // the full list document is returned (included id)
        res.send(listDoc);
    })
});


/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id', authenticate, (req, res) => {
    //we want to update the specified list (list document with id in the URL) with the new values specified in the JSON body of the request
    List.findOneAndUpdate({ _id: req.params.id , _userId: req.user_id}, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'updated'});
    });
});

app.delete('/lists/:id', authenticate, (req, res) => {
    //we want to delete the specified list (document with id in the URL)
    List.findOneAndRemove({ 
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);

        //delete tasks that are appended to that list
        deleteTaskFromList(removedListDoc._id);
    })
})


/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: To get one specific task in a list
 */
/*
app.get('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) => {
        res.send(task);
    });
})
*/

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks in a specific list
 */
app.get('/lists/:listId/tasks', authenticate, (req, res) => {
    //we want to return all tasks that belong to a specific list (specified by listId)
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    });
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a new task in a specified list
 */
app.post('/lists/:listId/tasks', authenticate, (req,res) => {
    // we want to create a new task in a list specified by listId
    // we have to check if currently loged in user has acess to the specified list id

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if(list){
        //list object is valid and found for that user
        // then the currently logged in user can create a new task
        return true;
        }
        // else - the user obj is undefined or incorrect id.
        return false;
    }).then((canCreateTask) => {
        if(canCreateTask) {
            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId
            });
            newTask.save().then((newTaskDoc) => {
                res.send(newTaskDoc);
            })
        } else {
            // list id theyr trying to access is not found
            res.sendStatus(404);
        }
    })

});

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    // we want to update an existing task ( specified by taskId)

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) =>{
        if(list){
            //list object is valid and found for that user
            // then the currently logged in user can update the task
            return true;
            }
            // else - the user obj is undefined or incorrect id.
            return false;
    }).then((canUpdateTasks) => {
        if(canUpdateTasks) {
            // the current user is auth and can update the tasks
            Task.findOneAndUpdate({ 
                _id: req.params.taskId,
                _listId: req.params.listId
            },  {
                    $set: req.body
                }
            ).then(() => {
                res.send({message: "Updated successfully."});
            })
        } else {
            res.sendStatus(404);
        }
    })

});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
    //check if user has access to the task
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) =>{
        if(list){
            //list object is valid and found for that user
            // then the currently logged in user can delete the task
            return true;
            }
            // else - the user obj is undefined or incorrect id.
            return false;
    }).then((canDeleteTask) => {
        if(canDeleteTask) {
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) => {
                res.send(removedTaskDoc);
            });
        } else {
            res.sendStatus(404);
        }
    });
    
});

/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign Up
 */
app.post('/users', (req,res) => {
    //User Sign up
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we generate a access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return {accessToken, refreshToken}
        });
    }).then((authToken) => {
        //now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * POST /users/login
 * Purpose: Login
 */

app.post('/users/login', (req,res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            //Session created successfully - refresh Token returned
            // now we generate a access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                //access auth token generated successfully, now return a object containing the auth token
                return {accessToken, refreshToken}
            });

        }).then((authToken) => {
            //now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authToken.refreshToken)
                .header('x-access-token', authToken.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})


/**
 * GET /users/me/access-token
 */
app.get('/users/me/access-token', verifySession, (req,res) => {
    //we know that user is auth and we have user object
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})



/* HELPER METHODS */
let deleteTaskFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from " + _listId + " were deleted!");
    });

}

app.listen (3000, () => {
    console.log("Server is listening on port 3000")
})
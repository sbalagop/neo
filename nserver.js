/*jslint node:true*/

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var oracledb = require('oracledb');


// Use body parser to parse JSON body
app.use(bodyParser.json());

var connAttrs = {
    "user": "hr",
    "password": "hr",
    "connectString": "130.35.95.45/XE"
};

// Http Method: GET
// URI        : /userprofiles
// Read all the user profiles
app.get('/user_profiles', function (req, res) {
    "use strict";

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM user_profiles", {}, {
            outFormat: 2
        }, function (err, result) {
            if (err || result === null) {
                // No user profile is not found
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the user profile" : "No user profile is found",
                    detailed_message: err ? err.message : null
                }));
            } else {
                res.contentType('application/json');
                res.status(200);
                res.send(JSON.stringify(result.rows));
            }

        });
    });
});

// Http method: GET
// URI        : /userprofiles/:user_name
// Read the profile of user given in :user_name
app.get('/user_profiles/:user_name', function (req, res) {
    "use strict";

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM user_profiles WHERE user_name = :userName", [req.params.user_name], {
            outFormat: 2
        }, function (err, result) {
            if (err || result === null) {
                // No user profile is not found
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the user profile" : "No user profile is found",
                    detailed_message: err ? err.message : null
                }));
            } else {
                res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
            }

        });
    });
});

// Http method: POST
// URI        : /user_profiles
// Creates a new user profile
app.post('/user_profiles', function (req, res) {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute("INSERT INTO user_profiles VALUES " +
            "(:user_name, :display_name, :description, :gender," +
            ":age, :country, :theme, :member_since) ", [req.body.user_name, req.body.display_name,
                            req.body.description, req.body.gender, req.body.age, req.body.country,
                            req.body.theme, req.body.member_since], {
                isAutoCommit: true,
                outFormat: 2
            },
            function (err, result) {
                if (err) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "User already exists" : "Input Error",
                        detailed_message: err.message
                    }));
                } else {
                    // Successfully created the resource
                    res.status(201).set('Location', '/user_profiles/' + req.body.user_name).end();
                }

            });
    });

});

// Build UPDATE query and prepare bind variables
var buildUpdateQuery = function buildUpdateQuery(req) {
    "use strict";

    var query = "UPDATE user_profiles SET ",
        bindValues = {};
    if (req.body.display_name) {
        query += "display_name = :display_name, ";
        bindValues.display_name = req.body.display_name;
    }
    if (req.body.description) {
        query += "description = :description, ";
        bindValues.description = req.body.description;
    }
    if (req.body.gender) {
        query += "gender = :gender, ";
        bindValues.gender = req.body.gender;
    }
    if (req.body.age) {
        query += "age = :age, ";
        bindValues.age = req.body.age;
    }
    if (req.body.country) {
        query += "country = :country, ";
        bindValues.country = req.body.country;
    }
    if (req.body.theme) {
        query += "theme = :theme, ";
        bindValues.theme = req.body.theme;
    }
    if (req.body.member_since) {
        query += "member_since = :member_since ";
        bindValues.member_since = req.body.member_since;
    }
    query += "WHERE user_name = :user_name";
    bindValues.user_name = req.params.user_name;
    return {
        query: query,
        bindValues: bindValues
    };
};

// Http method: PUT
// URI        : /user_profiles/:user_name
// Update the profile of user given in :user_name
app.put('/user_profiles/:user_name', function (req, res) {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateQuery = buildUpdateQuery(req);
        connection.execute(updateQuery.query, updateQuery.bindValues, {
                isAutoCommit: true,
                outFormat: 2
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: result.rowsAffected === 0 ? "User doesn't exist" : "Input Error",
                        detailed_message: result.rowsAffected === 0 ? "" : err.message
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.status(204).end();
                }

            });
    });

});

// Http method: DELETE
// URI        : /userprofiles/:user_name
// Delete the profile of user given in :user_name
app.delete('/user_profiles/:user_name', function (req, res) {
    "use strict";

    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("DELETE FROM user_profiles WHERE user_name = :userName", [req.params.user_name], {
            isAutoCommit: true,
            outFormat: 2
        }, function (err, result) {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: result.rowsAffected === 0 ? "User doesn't exist" : "Input Error",
                    detailed_message: result.rowsAffected === 0 ? "" : err.message
                }));
            } else {
                // Resource successfully deleted. Sending an empty response body. 
                res.status(204).end();
            }

        });
    });
});

var server = app.listen(3000, function () {
    "use strict";

    var host = server.address().address,
        port = server.address().port;

    console.log(' Server is listening at http://%s:%s', host, port);
});
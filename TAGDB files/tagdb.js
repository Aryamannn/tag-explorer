const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'taguser',
    password: 'taggy',
    database: 'TagDB'
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
});


//==============================================================================
//
// Tag related endpoints and support functions
//
//==============================================================================

//
// Support functions
//

function insertTagValue(tag_id, tag_value, res) {
    const createValueSql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?)';
    db.query(createValueSql, [tag_id, tag_value], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ value_id: result.insertId });
    });
}

//
// TAG - CREATE
//

// API to create a tag without any value
app.post('/tags/create', (req, res) => {
    const { tag_name } = req.body;

    // Check if the tag name exists
    const findTagSql = 'SELECT tag_id FROM tags WHERE tag_name = ?';
    db.query(findTagSql, [tag_name], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length > 0) {
            // Tag exists, return the existing tag_id
            res.send({ tag_id: results[0].tag_id });
        } else {
            // Tag doesn't exist, create it
            const createTagSql = 'INSERT INTO tags (tag_name) VALUES (?)';
            db.query(createTagSql, [tag_name], (err, result) => {
                if (err) return res.status(500).send(err);
                res.send({ tag_id: result.insertId });
            });
        }
    });
});

// API to create a tag and its values
app.post('/tags', (req, res) => {
    const { tag_name, tag_value } = req.body;

    // Check if the tag name exists
    const findTagSql = 'SELECT tag_id FROM tags WHERE tag_name = ?';
    db.query(findTagSql, [tag_name], (err, results) => {
        if (err) return res.status(500).send(err);

        let tag_id;
        if (results.length > 0) {
            // Tag exists, get the tag_id
            tag_id = results[0].tag_id;
            insertTagValue(tag_id, tag_value, res);
        } else {
            // Tag doesn't exist, create it
            const createTagSql = 'INSERT INTO tags (tag_name) VALUES (?)';
            db.query(createTagSql, [tag_name], (err, result) => {
                if (err) return res.status(500).send(err);
                tag_id = result.insertId;
                insertTagValue(tag_id, tag_value, res);
            });
        }
    });
});


//
// TAG - DELETE
//

// API to delete a tag
app.delete('/tags/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tags WHERE tag_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Tag deleted' });
    });
});


//
// TAG - QUERY
//

// API to list all tags
app.get('/tags', (req, res) => {
    const sql = 'SELECT * FROM tags';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// API to list tag values
app.get('/tag_values', (req, res) => {
    const sql = 'SELECT * FROM tag_values';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// API to list all tag values for a given tag name
app.get('/tags/:tag_name/values', (req, res) => {
    const { tag_name } = req.params;

    const sql = `
        SELECT tv.tag_value
        FROM tags t
        JOIN tag_values tv ON t.tag_id = tv.tag_id
        WHERE t.tag_name = ?
    `;

    db.query(sql, [tag_name], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

//
// TAG - UPDATE
//

// API to rename a tag
app.put('/tags/:id', (req, res) => {
    const { id } = req.params;
    const { tag_name } = req.body;
    const sql = 'UPDATE tags SET tag_name = ? WHERE tag_id = ?';
    db.query(sql, [tag_name, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Tag updated' });
    });
});

//==============================================================================
//
// File related endpoints and support functions
//
//==============================================================================

//
// Support Functions
//

function findOrCreateTagValue(tag_id, tag_value, file_id, res) {
    const findValueSql = 'SELECT value_id FROM tag_values WHERE tag_id = ? AND tag_value = ?';
    db.query(findValueSql, [tag_id, tag_value], (err, results) => {
        if (err) return res.status(500).send(err);

        let value_id;
        if (results.length > 0) {
            // Tag value exists, get the value_id
            value_id = results[0].value_id;
            addTagToFile(file_id, value_id, res);
        } else {
            // Tag value doesn't exist, create it
            const createValueSql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?)';
            db.query(createValueSql, [tag_id, tag_value], (err, result) => {
                if (err) return res.status(500).send(err);
                value_id = result.insertId;
                addTagToFile(file_id, value_id, res);
            });
        }
    });
}

function addTagToFile(file_id, value_id, res) {
    const sql = 'INSERT INTO file_tags (file_id, value_id) VALUES (?, ?)';
    db.query(sql, [file_id, value_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Tag added to file' });
    });
}


//
// FILE - CREATE
//

// API to add a file reference
app.post('/files', (req, res) => {
    const { file_path } = req.body;
    const sql = 'INSERT INTO files (file_path) VALUES (?)';
    db.query(sql, [file_path], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ file_id: result.insertId });
    });
});

//
// FILE - DELETE
//

// API to delete a tag based on its name
app.delete('/tags/delete/:tag_name', (req, res) => {
    const { tag_name } = req.params;

    const deleteTagSql = 'DELETE FROM tags WHERE tag_name = ?';
    db.query(deleteTagSql, [tag_name], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows > 0) {
            res.send({ message: 'Tag deleted' });
        } else {
            res.status(404).send({ message: 'Tag not found' });
        }
    });
});


//
// FILE - UPDATE
//

// API to add a tag to a file based on tag_name and tag_value
app.post('/files/:file_id/tags/add', (req, res) => {
    const { file_id } = req.params;
    const { tag_name, tag_value } = req.body;

    // Check if the tag exists
    const findTagSql = 'SELECT tag_id FROM tags WHERE tag_name = ?';
    db.query(findTagSql, [tag_name], (err, results) => {
        if (err) return res.status(500).send(err);

        let tag_id;
        if (results.length > 0) {
            // Tag exists, get the tag_id
            tag_id = results[0].tag_id;
            findOrCreateTagValue(tag_id, tag_value, file_id, res);
        } else {
            // Tag doesn't exist, create it
            const createTagSql = 'INSERT INTO tags (tag_name) VALUES (?)';
            db.query(createTagSql, [tag_name], (err, result) => {
                if (err) return res.status(500).send(err);
                tag_id = result.insertId;
                findOrCreateTagValue(tag_id, tag_value, file_id, res);
            });
        }
    });
});

// API to remove a tag from a file
app.delete('/files/:file_id/tags/:value_id', (req, res) => {
    const { file_id, value_id } = req.params;
    const sql = 'DELETE FROM file_tags WHERE file_id = ? AND value_id = ?';
    db.query(sql, [file_id, value_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Tag removed from file' });
    });
});

//
// FILE - QUERY
//

// API to retrieve files with given tag values
app.get('/files', (req, res) => {
    const { tag_name, tag_value } = req.query;
    const sql = `
        SELECT f.file_path
        FROM files f
        JOIN file_tags ft ON f.file_id = ft.file_id
        JOIN tag_values tv ON ft.value_id = tv.value_id
        JOIN tags t ON tv.tag_id = t.tag_id
        WHERE t.tag_name = ? AND tv.tag_value = ?
    `;
    db.query(sql, [tag_name, tag_value], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// API to list tags for a specific file
app.get('/files/:file_id/tags', (req, res) => {
    const { file_id } = req.params;
    const sql = `
        SELECT t.tag_name, tv.tag_value
        FROM tags t
        JOIN tag_values tv ON t.tag_id = tv.tag_id
        JOIN file_tags ft ON tv.value_id = ft.value_id
        WHERE ft.file_id = ?
    `;
    db.query(sql, [file_id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
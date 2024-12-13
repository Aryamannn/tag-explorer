// routes/tagEditorRoutes.js
// const express = require('express');
// const router = express.Router();
// const mysql = require('mysql2');
// const db = require('./db');


const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'taguser',
//     password: 'taggy',
//     database: 'TagDB'
// });

// // Connect to the database
// db.connect(err => {
//     if (err) throw err;
//     console.log('MySQL connected...');
// });

// Get the tag editor page with all tags
router.get('/', async (req, res) => {
    const sql = `
        SELECT t.tag_id, t.tag_name, tv.value_id as subtag_id, tv.tag_value as subtag_name
        FROM tags t
        LEFT JOIN tag_values tv ON t.tag_id = tv.tag_id
        ORDER BY t.tag_name, tv.tag_value
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching tags:', err);
            return res.status(500).send('Error loading tags');
        }
        
        const tags = [];
        const tagsMap = new Map();
        
        results.forEach(row => {
            if (!tagsMap.has(row.tag_id)) {
                const tag = {
                    id: row.tag_id,
                    name: row.tag_name,
                    isExpanded: false,
                    subTags: []
                };
                tags.push(tag);
                tagsMap.set(row.tag_id, tag);
            }
            if (row.subtag_id) {
                tagsMap.get(row.tag_id).subTags.push({
                    id: row.subtag_id,
                    name: row.subtag_name
                });
            }
        });
        
        res.render('tag-editor', {
            tags: tags,
            editingTag: null
        });
    });
});

// Create new main tag
router.post('/tags/create', (req, res) => {
    const { tag_name } = req.body;
    
    const sql = 'INSERT INTO tags (tag_name) VALUES (?)';
    db.query(sql, [tag_name], (err, result) => {
        if (err) {
            console.error('Error creating tag:', err);
            return res.status(500).json({ error: 'Failed to create tag' });
        }
        res.json({ tag_id: result.insertId });
    });
});

// Create new subtag (tag value)
router.post('/tags', (req, res) => {
    const { tag_id, tag_value } = req.body;
    
    const sql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?)';
    db.query(sql, [tag_id, tag_value], (err, result) => {
        if (err) {
            console.error('Error creating subtag:', err);
            return res.status(500).json({ error: 'Failed to create subtag' });
        }
        res.json({ value_id: result.insertId });
    });
});

// Update tag
router.put('/tags/:id', (req, res) => {
    const { id } = req.params;
    const { tag_name } = req.body;
    
    const sql = 'UPDATE tags SET tag_name = ? WHERE tag_id = ?';
    db.query(sql, [tag_name, id], (err) => {
        if (err) {
            console.error('Error updating tag:', err);
            return res.status(500).json({ error: 'Failed to update tag' });
        }
        res.json({ message: 'Tag updated successfully' });
    });
});

// Update tag value
router.put('/tag_values/:id', (req, res) => {
    const { id } = req.params;
    const { tag_value } = req.body;
    
    const sql = 'UPDATE tag_values SET tag_value = ? WHERE value_id = ?';
    db.query(sql, [tag_value, id], (err) => {
        if (err) {
            console.error('Error updating tag value:', err);
            return res.status(500).json({ error: 'Failed to update tag value' });
        }
        res.json({ message: 'Tag value updated successfully' });
    });
});

// Delete tag
router.delete('/tags/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM tags WHERE tag_id = ?';
    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Error deleting tag:', err);
            return res.status(500).json({ error: 'Failed to delete tag' });
        }
        res.json({ message: 'Tag deleted successfully' });
    });
});

// Delete tag value
router.delete('/tag_values/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM tag_values WHERE value_id = ?';
    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Error deleting tag value:', err);
            return res.status(500).json({ error: 'Failed to delete tag value' });
        }
        res.json({ message: 'Tag value deleted successfully' });
    });
});

module.exports = router;
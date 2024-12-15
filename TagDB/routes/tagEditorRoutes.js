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

router.post('/tags/create', (req, res) => {
    const { tag_name } = req.body;
    
    if (!tag_name) {
        return res.status(400).json({ error: 'Tag name is required' });
    }

    // Add timestamp to make the tag name unique
    const timestamp = new Date().getTime();
    const uniqueTagName = `${tag_name} ${timestamp}`;

    console.log('Creating tag with name:', uniqueTagName);

    const sql = 'INSERT INTO tags (tag_name) VALUES (?)';
    db.query(sql, [uniqueTagName], (err, result) => {
        if (err) {
            console.error('Error creating tag:', err);
            return res.status(500).json({ error: 'Failed to create tag' });
        }
        res.json({ tag_id: result.insertId });
    });
});

// Create new subtag (tag value)
router.post('/tags/:tagId/values', (req, res) => {
    const { tagId } = req.params;
    const { tag_value } = req.body;
    
    if (!tag_value) {
        return res.status(400).json({ error: 'Tag value is required' });
    }

    const sql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?)';
    db.query(sql, [tagId, tag_value], (err, result) => {
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
    
    if (!tag_name) {
        return res.status(400).json({ error: 'Tag name is required' });
    }

    const sql = 'UPDATE tags SET tag_name = ? WHERE tag_id = ?';
    db.query(sql, [tag_name, id], (err, result) => {
        if (err) {
            console.error('Error updating tag:', err);
            return res.status(500).json({ error: 'Failed to update tag' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        
        res.json({ message: 'Tag updated successfully' });
    });
});

// Update tag value
router.put('/tags/values/:id', (req, res) => {
    const { id } = req.params;
    const { tag_value } = req.body;
    
    if (!tag_value) {
        return res.status(400).json({ error: 'Tag value is required' });
    }

    const sql = 'UPDATE tag_values SET tag_value = ? WHERE value_id = ?';
    db.query(sql, [tag_value, id], (err, result) => {
        if (err) {
            console.error('Error updating tag value:', err);
            return res.status(500).json({ error: 'Failed to update tag value' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag value not found' });
        }
        
        res.json({ message: 'Tag value updated successfully' });
    });
});

// Delete tag (with cascading delete of values and file_tags)
router.delete('/tags/:id', (req, res) => {
    const { id } = req.params;

    // First delete related records from tag_values and file_tags
    const deleteTagValuesSql = 'DELETE FROM tag_values WHERE tag_id = ?';
    db.query(deleteTagValuesSql, [id], (err) => {
        if (err) {
            console.error('Error deleting tag values:', err);
            return res.status(500).json({ error: 'Failed to delete tag values' });
        }
        
        // Then delete the tag itself
        const deleteTagSql = 'DELETE FROM tags WHERE tag_id = ?';
        db.query(deleteTagSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting tag:', err);
                return res.status(500).json({ error: 'Failed to delete tag' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Tag not found' });
            }
            
            res.json({ message: 'Tag deleted successfully' });
        });
    });
});

// Delete tag value (with cascading delete of file_tags)
router.delete('/tags/values/:id', (req, res) => {
    const { id } = req.params;

    // First delete related records from file_tags
    const deleteFileTagsSql = 'DELETE FROM file_tags WHERE value_id = ?';
    db.query(deleteFileTagsSql, [id], (err) => {
        if (err) {
            console.error('Error deleting file tags:', err);
            return res.status(500).json({ error: 'Failed to delete file tags' });
        }
        
        // Then delete the tag value itself
        const deleteValueSql = 'DELETE FROM tag_values WHERE value_id = ?';
        db.query(deleteValueSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting tag value:', err);
                return res.status(500).json({ error: 'Failed to delete tag value' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Tag value not found' });
            }
            
            res.json({ message: 'Tag value deleted successfully' });
        });
    });
});

module.exports = router;
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./routes/db');

// Define and ensure test_dir exists
const filesDirectory = path.join(__dirname, 'test_dir');
try {
    if (!fs.existsSync(filesDirectory)) {
        fs.mkdirSync(filesDirectory, { recursive: true });
        console.log('Created test_dir directory');
    }
} catch (err) {
    console.error('Error creating directory:', err);
}

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');

// Global array to hold default tag/value pairs
const defaultTags = [
    { tag_name: 'Content Type', tag_value: 'LocalFile', value_id: null }
];

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database as ID', db.threadId);
});

// API Endpoints
app.get('/tags', (req, res) => {
    const sql = 'SELECT * FROM tags';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching tags:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.get('/tag_values', (req, res) => {
    const sql = 'SELECT * FROM tag_values';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching tag values:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.get('/default-tags', (req, res) => {
    const sql = `
        SELECT t.tag_name, tv.tag_value, tv.value_id
        FROM tags t
        LEFT JOIN tag_values tv ON t.tag_id = tv.tag_id
        WHERE t.tag_name IN ('Content Type')
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching default tags:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Helper Functions
function getFileType(filePath) {
    try {
        if (!filePath) return 'Unknown';
        const extension = path.extname(filePath).toLowerCase().slice(1);
        const fileTypes = {
            pdf: 'PDF Document',
            doc: 'Word Document',
            docx: 'Word Document',
            xls: 'Excel Spreadsheet',
            xlsx: 'Excel Spreadsheet',
            ppt: 'PowerPoint Presentation',
            pptx: 'PowerPoint Presentation',
            txt: 'Text File',
            jpg: 'JPEG Image',
            jpeg: 'JPEG Image',
            png: 'PNG Image',
            gif: 'GIF Image',
            zip: 'Compressed File',
            rar: 'Compressed File',
            mp4: 'Multimedia Video'
        };
        return fileTypes[extension] || 'Unknown File Type';
    } catch (err) {
        console.error('Error getting file type:', err);
        return 'Unknown File Type';
    }
}

function safeGetFileStats(filePath) {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            return {
                exists: false,
                error: 'File not found'
            };
        }
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            modifiedDate: stats.mtime,
            createdDate: stats.birthtime,
            fileType: getFileType(filePath)
        };
    } catch (err) {
        console.error(`Error getting file stats for ${filePath}:`, err);
        return {
            exists: false,
            error: err.message
        };
    }
}

function returnMetadata(data) {
    if (!Array.isArray(data)) return [];

    return data.map(file => {
        if (!file?.file_path) {
            return { ...file, metadata: null };
        }

        try {
            const filePath = path.join(filesDirectory, file.file_path.split('/').pop());
            const stats = safeGetFileStats(filePath);
            return {
                ...file,
                metadata: stats.exists ? {
                    size: stats.size,
                    modifiedDate: stats.modifiedDate,
                    createdDate: stats.createdDate,
                    fileType: stats.fileType
                } : {
                    size: 0,
                    modifiedDate: null,
                    createdDate: null,
                    fileType: 'Unknown',
                    error: stats.error
                }
            };
        } catch (err) {
            console.error(`Error processing metadata for ${file.file_path}:`, err);
            return {
                ...file,
                metadata: {
                    size: 0,
                    modifiedDate: null,
                    createdDate: null,
                    fileType: 'Unknown',
                    error: err.message
                }
            };
        }
    });
}

// Import routes
const tagExplorerRoutes = require("./routes/tagExplorerRoutes");
const tagEditorRoutes = require("./routes/tagEditorRoutes");
const mangeTagsRoutes = require("./routes/manageTagsRoutes");
const switchViewRoutes = require("./routes/switchViewRoutes");

// Use routes
app.use("/", tagExplorerRoutes);
app.use("/tag-editor", tagEditorRoutes);
app.use("/manage-tags", mangeTagsRoutes);
app.use("/switch-view", switchViewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    ensureDefaultTags();
});

// Ensure default tags exist
function ensureDefaultTags() {
    defaultTags.forEach(tag => {
        const { tag_name, tag_value } = tag;
        
        const insertTagSql = 'INSERT INTO tags (tag_name) VALUES (?) ON DUPLICATE KEY UPDATE tag_id = LAST_INSERT_ID(tag_id)';
        db.query(insertTagSql, [tag_name], (err, tagResult) => {
            if (err) {
                console.error(`Error ensuring default tag: ${tag_name}`, err);
                return;
            }
            
            const tag_id = tagResult.insertId;
            const insertValueSql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_id = LAST_INSERT_ID(value_id)';
            
            db.query(insertValueSql, [tag_id, tag_value], (err, valueResult) => {
                if (err) {
                    console.error(`Error ensuring default tag value: ${tag_value}`, err);
                    return;
                }
                tag.value_id = valueResult.insertId;
            });
        });
    });
}

module.exports = {
    db,
    filesDirectory,
    getFileType,
    returnMetadata,
    safeGetFileStats
};
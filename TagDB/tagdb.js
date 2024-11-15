const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const db = require('./routes/db');
const fs = require('fs');
const path = require('path');


const filesDirectory = path.join(__dirname, 'test_dir');

const app = express();
app.use(cors());
app.use(express.json());

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));



// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'taguser',
//     password: 'taggy',
//     database: 'TagDB'
// });

// Global array to hold default tag/value pairs
const defaultTags = [
  { tag_name: 'Content Type', tag_value: 'LocalFile', value_id: null }
];

// Connect to the database
// db.connect(err => {
//     if (err) throw err;
//     console.log('MySQL connected...');
// });

//routes
// Import route files
const tagExplorerRoutes = require("./routes/tagExplorerRoutes");
const tagEditorRoutes = require("./routes/tagEditorRoutes");
const mangeTagsRoutes = require("./routes/manageTagsRoutes");
const switchViewRoutes = require("./routes/switchViewRoutes");


// Use route files
app.use("/", tagExplorerRoutes);
app.use("/tag-editor", tagEditorRoutes);
app.use("/manage-tags", mangeTagsRoutes );
app.use("/switch-view", switchViewRoutes );


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

// API to list each tag with all of its values
app.get('/tags/with-values', (req, res) => {
    const sql = `
        SELECT t.tag_name, tv.tag_value
        FROM tags t
        LEFT JOIN tag_values tv ON t.tag_id = tv.tag_id
        ORDER BY t.tag_name, tv.tag_value
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);

        // Format the result to group tag values under each tag name
        const tagsWithValues = {};
        results.forEach(row => {
            if (!tagsWithValues[row.tag_name]) {
                tagsWithValues[row.tag_name] = [];
            }
            if (row.tag_value) {
                tagsWithValues[row.tag_name].push(row.tag_value);
            }
        });

        res.send(tagsWithValues);
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

// Function to associate a file with a tag value
function addTagByID(file_id, value_id) {
  const insertFileTagSql = 'INSERT INTO file_tags (file_id, value_id) VALUES (?, ?)';
  db.query(insertFileTagSql, [file_id, value_id], (err) => {
    if (err) {
      console.error(`Error adding tag value ${value_id} to file ${file_id}`, err);
      return;
    }
  });
}

// Function to add default tags to a file
function addDefaultTags(file_id) {
  defaultTags.forEach(tag => {
    if (tag.value_id) {
      addTagByID(file_id, tag.value_id);
    } else {
      console.error(`No value_id found for ${tag.tag_name}: ${tag.tag_value}`);
    }
  });
}

function ensureDefaultTags() {
  defaultTags.forEach(tag => {
    const { tag_name, tag_value } = tag;

    // Step 1: Try inserting or retrieving the tag_id from the tags table
    const insertTagSql = 'INSERT INTO tags (tag_name) VALUES (?) ON DUPLICATE KEY UPDATE tag_id = LAST_INSERT_ID(tag_id)';
    db.query(insertTagSql, [tag_name], (err, tagResult) => {
      if (err) {
        console.error(`Error inserting or retrieving tag_id for tag_name: ${tag_name}`, err);
        return;
      }
      const tag_id = tagResult.insertId; // Get tag_id, either inserted or retrieved
      
      // Step 2: Insert or retrieve the value_id from the tag_values table
      const insertValueSql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_id = LAST_INSERT_ID(value_id)';
      db.query(insertValueSql, [tag_id, tag_value], (err, valueResult) => {
        if (err) {
          console.error(`Error inserting or retrieving value_id for tag_value: ${tag_value} with tag_id: ${tag_id}`, err);
          return;
        }
        // Remember the value_id in the defaultTags array
        tag.value_id = valueResult.insertId;
      });
    });
  });
}

// Helper function to add the tag to a file
function addTagToFile(file_id, tag_name, tag_value, res) {
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
}

function findOrCreateTagValue(tag_id, tag_value, file_id, res) {
    const findValueSql = 'SELECT value_id FROM tag_values WHERE tag_id = ? AND tag_value = ?';
    db.query(findValueSql, [tag_id, tag_value], (err, results) => {
        if (err) return res.status(500).send(err);

        let value_id;
        if (results.length > 0) {
            // Tag value exists, get the value_id
            value_id = results[0].value_id;
            insertFileTag(file_id, value_id, res);
        } else {
            // Tag value doesn't exist, create it
            const createValueSql = 'INSERT INTO tag_values (tag_id, tag_value) VALUES (?, ?)';
            db.query(createValueSql, [tag_id, tag_value], (err, result) => {
                if (err) return res.status(500).send(err);
                value_id = result.insertId;
                insertFileTag(file_id, value_id, res);
            });
        }
    });
}

function insertFileTag(file_id, value_id, res) {
    const insertFileTagSql = 'INSERT INTO file_tags (file_id, value_id) VALUES (?, ?)';
    db.query(insertFileTagSql, [file_id, value_id], (err, result) => {
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
        addDefaultTags(result.insertId);
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

// API to add a tag to a file based on file path (file name)
// If the file doesn't exist, create it and then apply the tag
app.post('/files/by-name/tags/add', (req, res) => {
    let { file_path, tag_name, tag_value } = req.body;

    // Trim whitespace from the inputs
    file_path = file_path ? file_path.trim() : '';
    tag_name = tag_name ? tag_name.trim() : '';
    tag_value = tag_value ? tag_value.trim() : '';

    // Check if any of the required fields are empty
    if (!file_path || !tag_name || !tag_value) {
        return res.status(400).send({
            message: "Invalid input. 'file_path', 'tag_name', and 'tag_value' are required and cannot be empty."
        });
    }

    // Check if the file already exists in the database
    const findFileSql = 'SELECT file_id FROM files WHERE file_path = ?';
    db.query(findFileSql, [file_path], (err, results) => {
        if (err) return res.status(500).send(err);

        let file_id;
        if (results.length > 0) {
            // File already exists, get the file_id
            file_id = results[0].file_id;
            addTagToFile(file_id, tag_name, tag_value, res);
        } else {
            // File doesn't exist, create it
            const createFileSql = 'INSERT INTO files (file_path) VALUES (?)';
            db.query(createFileSql, [file_path], (err, result) => {
                if (err) return res.status(500).send(err);
                file_id = result.insertId;
                // Now add the tag to the new file
                addTagToFile(file_id, tag_name, tag_value, res);
            });
        }
    });
});

// API to add a tag to a file based on file_id
// NOTE: This must be declated AFTER /files/by-name/tags/add
//       If not, the routing will be confused.
app.post('/files/:file_id/tags/add', (req, res) => {
    const { file_id } = req.params;
    const { tag_name, tag_value } = req.body;

    // Use the same helper function to add a tag to the file
    addTagToFile(file_id, tag_name, tag_value, res);
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

// API to retrieve files with a specific tag/value pair
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


function buildFileQuery(tagValuePairs) {
    // Create placeholders for the tag_name and tag_value pairs in the SQL query
    const placeholders = tagValuePairs.map(() => "(t.tag_name = ? AND tv.tag_value = ?)").join(" OR ");
    const queryValues = tagValuePairs.reduce((arr, pair) => [...arr, pair.tag_name, pair.tag_value], []);

    // SQL query that counts the number of tag/value matches per file
    const sql = `
        SELECT f.file_id, f.file_path, COUNT(*) as match_count
        FROM files f
        JOIN file_tags ft ON f.file_id = ft.file_id
        JOIN tag_values tv ON ft.value_id = tv.value_id
        JOIN tags t ON tv.tag_id = t.tag_id
        WHERE ${placeholders}
        GROUP BY f.file_id
        HAVING COUNT(*) = ?
    `;

    return sql;
}

// API to retrieve files with all given tag/value pairs
app.post('/files/tags', (req, res) => {
  const tagValuePairs = req.body.tagValuePairs;

  const wildcardTagValuePairs = [];
  const normalTagValuePairs = [];

  // Separate wildcard and non-wildcard tag-value pairs
  const promises = tagValuePairs.map(tagPair => {
    if (tagPair.tag_value === '*') {
      return new Promise((resolve, reject) => {
        // Get all possible values for the wildcard tag
        const findValuesSql = 'SELECT tag_value FROM tag_values tv JOIN tags t ON t.tag_id = tv.tag_id WHERE t.tag_name = ?';
        db.query(findValuesSql, [tagPair.tag_name], (err, results) => {
          if (err) return reject(err);

          // Store all possible values for the wildcard
          results.forEach(row => {
            wildcardTagValuePairs.push({
              tag_name: tagPair.tag_name,
              tag_value: row.tag_value
            });
          });

          resolve();
        });
      });
    } else {
      // No wildcard, treat it as a normal AND condition
      normalTagValuePairs.push(tagPair);
      return Promise.resolve();
    }
  });

  // Wait for all asynchronous wildcard queries to complete
  Promise.all(promises)
    .then(() => {
      if (wildcardTagValuePairs.length > 0) {
        // Step 1: Create a temporary table with wildcard results
        const wildcardSql = `
          CREATE TEMPORARY TABLE temp_files AS
          SELECT DISTINCT f.file_id
          FROM files f
          JOIN file_tags ft ON f.file_id = ft.file_id
          JOIN tag_values tv ON ft.value_id = tv.value_id
          JOIN tags t ON t.tag_id = tv.tag_id
          WHERE ${wildcardTagValuePairs.map(() => "(t.tag_name = ? AND tv.tag_value = ?)").join(" OR ")}
        `;
        const wildcardValues = wildcardTagValuePairs.reduce((arr, pair) => [...arr, pair.tag_name, pair.tag_value], []);

        db.query(wildcardSql, wildcardValues, (err) => {
          if (err) return res.status(500).send(err);

          // Step 2: Query the temporary table for non-wildcard conditions
          if (normalTagValuePairs.length > 0) {
            const normalSql = `
              SELECT f.*
              FROM temp_files tf
              JOIN files f ON f.file_id = tf.file_id
              JOIN file_tags ft ON f.file_id = ft.file_id
              JOIN tag_values tv ON ft.value_id = tv.value_id
              JOIN tags t ON t.tag_id = tv.tag_id
              WHERE ${normalTagValuePairs.map(() => "(t.tag_name = ? AND tv.tag_value = ?)").join(" OR ")}
              GROUP BY f.file_id
              HAVING ${normalTagValuePairs.map(pair => `COUNT(DISTINCT CASE WHEN t.tag_name = '${pair.tag_name}' AND tv.tag_value = '${pair.tag_value}' THEN 1 END) > 0`).join(" AND ")}
            `;
            const normalValues = normalTagValuePairs.reduce((arr, pair) => [...arr, pair.tag_name, pair.tag_value], []);

            db.query(normalSql, normalValues, (err, files) => {
              if (err) return res.status(500).send(err);
              
              // Drop the temporary table after querying
              db.query('DROP TEMPORARY TABLE IF EXISTS temp_files', () => {
            
                  res.json(returnMetadata(files));
              });
            });
          } else {
            // No normal tag-value pairs, just return the wildcard results
            const sql = `SELECT f.* FROM temp_files tf JOIN files f ON f.file_id = tf.file_id`;
            db.query(sql, (err, results) => {
              if (err) return res.status(500).send(err);
              
              // Drop the temporary table after querying
              db.query('DROP TEMPORARY TABLE IF EXISTS temp_files', () => {            
                  res.json(returnMetadata(results));
              });
            });
          }
        });
      } else {
        // No wildcards, just query normally against the files table
        const sql = `
          SELECT f.*
          FROM files f
          JOIN file_tags ft ON f.file_id = ft.file_id
          JOIN tag_values tv ON ft.value_id = tv.value_id
          JOIN tags t ON t.tag_id = tv.tag_id
          WHERE ${normalTagValuePairs.map(() => "(t.tag_name = ? AND tv.tag_value = ?)").join(" OR ")}
          GROUP BY f.file_id
          HAVING ${normalTagValuePairs.map(pair => `COUNT(DISTINCT CASE WHEN t.tag_name = '${pair.tag_name}' AND tv.tag_value = '${pair.tag_value}' THEN 1 END) > 0`).join(" AND ")}
        `;
        const values = normalTagValuePairs.reduce((arr, pair) => [...arr, pair.tag_name, pair.tag_value], []);

        db.query(sql, values, (err, files) => {
          if (err) return res.status(500).send(err);      
            res.json(returnMetadata(files));
        });
      }
    })
    .catch(error => {
      console.error('Error processing tag queries:', error);
      res.status(500).send('Error processing tag queries');
    });
});

app.get('/allFiles', (req, res) => {
  const sql = 'SELECT * FROM files'; // SQL query to fetch all files

  db.query(sql, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
      }
      const filesWithMetadata = results.map(file => {
      const filePath = path.join(filesDirectory, file.file_path.split('/').pop()); 
        try {
            // Get file metadata using fs.statSync (synchronous method)
            const stats = fs.statSync(filePath);

            // Add metadata to the file object
            return {
                ...file,
                metadata: {
                    size: stats.size,  // Size in bytes
                    modifiedDate: stats.mtime,  // Last modified date
                    createdDate: stats.birthtime,  // Creation date
                    fileType: getFileType(filePath),  // Get file type based on extension
                }
            };
        } catch (err) {
            console.error(`Error retrieving metadata for ${filePath}:`, err);
            return {
                ...file,
                metadata: null  // If there's an error, return null metadata
            };
        }
    });

      res.json(filesWithMetadata);
  });
});

app.post("/files/searchTags", (req, res) => {
  const tagIds = req.body.tagIdsToQuery; // Expecting an array of tag_ids

  // Check if tagIds is provided and is an array
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: "Invalid input. Please provide an array of tag_ids." });
  }

  // Construct the SQL query
  const sql = `
      SELECT f.*
      FROM files f
      INNER JOIN file_tags ft ON f.file_id = ft.file_id
      INNER JOIN tag_values tv ON ft.value_id = tv.value_id
      INNER JOIN tags t ON tv.value_id = t.tag_id
      WHERE tv.tag_name IN (?)
      GROUP BY f.file_id
  `;

  // Extract tag_ids from the request body
  const tagIdList = tagIds.map(tag => tag.tag_id).filter(id => id); // Ensure to filter out any undefined or null ids

  db.query(sql, [tagIdList], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database error" });
      }

      res.json(results); // Send the results back to the client
  });
});

app.post('/files/combineTags', (req, res) => {
  const { tagIds, valueIds } = req.body; // Expecting arrays of tag_ids and value_ids

  if (!Array.isArray(tagIds) || !Array.isArray(valueIds)) {
      return res.status(400).json({ error: 'tagIds and valueIds must be arrays' });
  }

  const helperQuery = `
     SELECT DISTINCT file_id FROM files f
      NATURAL JOIN file_tags
      NATURAL JOIN tag_values
      WHERE file_id in (${tagIds})
      
      UNION

      (SELECT DISTINCT file_id
      FROM files f
      NATURAL JOIN file_tags
      WHERE value_id IN (${valueIds}));
  `;


  db.query(helperQuery, (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
      }
        res.json(returnMetadata(results));
      // console.log(results)
  });
});

app.post('/files/searchByTagId', (req, res) => {
  const { tagIds } = req.body; // Expecting an array of tag_ids
  console.log("API " + tagIds);
  if (!Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'tagIds must be an array' });
  }

  // Create a comma-separated list of tag IDs for the SQL query
  const query = `
      SELECT DISTINCT f.file_id, f.file_path
      FROM files f
      JOIN file_tags ft ON f.file_id = ft.file_id
      WHERE ft.value_id IN (
          SELECT value_id FROM tag_values WHERE tag_id IN (${tagIds})
      )
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
      }
        res.json(returnMetadata(results));
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

function getFileType(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  switch (extension) {
      case 'pdf':
          return 'PDF Document';
      case 'doc':
      case 'docx':
          return 'Word Document';
      case 'xls':
      case 'xlsx':
          return 'Excel Spreadsheet';
      case 'ppt':
      case 'pptx':
          return 'PowerPoint Presentation';
      case 'txt':
          return 'Text File';
      case 'jpg':
      case 'jpeg':
          return 'JPEG Image';
      case 'png':
          return 'PNG Image';
      case 'gif':
          return 'GIF Image';
      case 'zip':
      case 'rar':
          return 'Compressed File';
      case 'mp4':
          return 'Multimedia Video';
      default:
          return 'Unknown File Type';
  }
}

function returnMetadata(data){
  const filesWithMetadata = data.map(file => {
    const filePath = path.join(filesDirectory, file.file_path.split('/').pop()); 
      try {
          // Get file metadata using fs.statSync (synchronous method)
          const stats = fs.statSync(filePath);

          // Add metadata to the file object
          return {
              ...file,
              metadata: {
                  size: stats.size,  // Size in bytes
                  modifiedDate: stats.mtime,  // Last modified date
                  createdDate: stats.birthtime,  // Creation date
                  fileType: getFileType(filePath),  // Get file type based on extension
              }
          };
      } catch (err) {
          console.error(`Error retrieving metadata for ${filePath}:`, err);
          return {
              ...file,
              metadata: null  // If there's an error, return null metadata
          };
      }
  });

  return(filesWithMetadata);
}


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // ensureDefaultTags();
});
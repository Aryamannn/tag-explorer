// const path = require('path')
const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filesDirectory = path.join(__dirname, '..', '..','TagDB-main','TagDB-main', 'test_dir');

// app.use(express.static(path.join(__dirname, 'public')));


// Route to render the tag explorer page
// Route to render the tag explorer page
router.get("/",  (req, res) => {
    const sqlTags = 'SELECT * FROM tags'; // Query to get all tags
    db.query(sqlTags, (err, tagResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        // Query to get all tag values with corresponding tag ID
        const sqlTagValues = 'SELECT * FROM tag_values';
        db.query(sqlTagValues, (err, tagValueResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            // Combine tags and their values
            const tagsWithValues = tagResults.map(tag => {
                return {
                    ...tag,
                    tag_values: tagValueResults.filter(value => value.tag_id === tag.tag_id) // Match on tag_id
                };
            });

            // Query to get all files
            const sqlFiles = 'SELECT f.file_id, f.file_path, GROUP_CONCAT(DISTINCT tv.value_id) AS tag_values, GROUP_CONCAT(DISTINCT t.tag_id) AS tag_names FROM files f LEFT JOIN file_tags ft ON f.file_id = ft.file_id LEFT JOIN tag_values tv ON ft.value_id = tv.value_id LEFT JOIN tags t ON tv.tag_id = t.tag_id GROUP BY f.file_id, f.file_path ORDER BY f.file_path ASC;';
            db.query(sqlFiles, async (err, fileResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database error");
                }

                // console.log(JSON.stringify(tagsWithValues, null, 2));
                // console.log(JSON.stringify(fileResults, null, 2));
                const filesWithMetadata = fileResults.map(file => {
                    const filePath = path.join(filesDirectory, file.file_path.split('/').pop()); // Assuming the `file_path` is relative
                    const stats = fs.statSync(filePath); // Get file metadata
                    return {
                        ...file,
                        size: stats.size, // File size in bytes
                        modifiedDate: stats.mtime // Last modified date
                    };
                });

                try {
                    const [tagValuesResponse] = await Promise.all([
                        axios.get('http://localhost:3000/tag_values')// Fetching default tags from the new API
                    ]);
                    const tagValues = tagValuesResponse.data;
                    res.render("tag-explorer", { tags: tagsWithValues, files: filesWithMetadata, tagValues: tagValues });
                } catch (error) {
                    console.error(error);
                    res.status(500).send('Server error');
                }
                // Render the view with both tags and files
                
            });
        });
    });
});

router.get('/open/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(filesDirectory, fileName);
    console.log(fileName+ "path:" + filePath);
    // Check if the file exists before trying to open it
    if (fs.existsSync(filePath)) {
      const openCommand = process.platform === 'win32' ? '' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
      console.log(openCommand+ "path:" + filePath);
      exec(`${openCommand} "${filePath}"`, (error) => {
        if (error) {
          console.error(`Error opening file: ${error}`);
          return res.status(500).send('Error opening file');
        }
        res.send(`Opening file: ${fileName}`);
      });
    } else {
      res.status(404).send('File not found');
    }
  });


module.exports = router;
